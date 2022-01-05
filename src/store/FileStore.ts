import { UPDATE } from "@airgram/constants";
import { DownloadFileParams, File } from "@airgram/core";
import { makeAutoObservable, observable } from "mobx";
import { useEffect, useState } from "react";
import { store as rootStore } from "../components/StoreProvider";
import { blobToBase64, blobToJson, blobToLotty, blobToText } from "../utils";
import HandlersBuilder from "../utils/HandlersBuilder";
import RootStore from "./RootStore";

const cache = new Map<number, any>();

type FileFormats = "blob" | "base64" | "text" | "json" | "lotty";

type FileFormat<TFormat extends FileFormats> = TFormat extends "blob"
    ? Blob
    : TFormat extends "base64" | "text"
    ? string
    : TFormat extends "json" | "lotty"
    ? object
    : never;

type DownloadParams = Omit<DownloadFileParams, "fileId">;

export default class FileStore<TFormat extends FileFormats> {
    isLoading = false;
    setLoading(value: boolean) {
        this.isLoading = value;
    }
    private format?: FileFormats = undefined;
    private file?: File = undefined;
    content?: FileFormat<TFormat> = undefined;
    setContent(content: any) {
        this.content = content;
    }
    private params?: DownloadParams = undefined;
    constructor(private rootStore: RootStore, file?: File, format?: FileFormats, params?: DownloadParams) {
        makeAutoObservable(this, { content: observable.ref, handlers: false });
        this.file = file;
        this.format = format;
        this.params = params;
        this.load();

        rootStore.events.addListener(RootStore.eventName, this.handlers);
    }

    dispose() {
        this.rootStore.events.removeListener(RootStore.eventName, this.handlers);
    }

    handlers = new HandlersBuilder()
        .add(UPDATE.updateFile, (ctx, next) => {
            if (ctx.update.file.id === this.file?.id) {
                this.load();
            }

            return next();
        })
        .build();

    setFile(file?: File, format?: FileFormats, params?: DownloadParams) {
        this.file = file;

        if (this.format !== format) {
            this.content = undefined;
            this.format = format;
        }

        this.params = params;
        return this.load();
    }

    async load() {
        if (!this.file || this.isLoading) {
            return;
        }

        if (this.content) {
            return this.content;
        }

        try {
            this.setLoading(true);

            const fileId = this.file.id;

            const cachedValue = cache.get(fileId);
            if (cachedValue) {
                this.setContent(cachedValue);
                return cachedValue;
            }

            const download = await this.rootStore.Airgram.api.downloadFile({ fileId, priority: 1, ...this.params });

            if (download.response._ === "error") {
                return;
            }

            const file = await this.rootStore.Airgram.api.readFilePart({ fileId });

            if (file.response._ === "error") {
                return;
            }

            const blob = file.response.data as unknown as Blob;

            let content: any = null;
            if (this.format === "blob") {
                content = blob;
            }

            if (this.format === "base64") {
                content = await blobToBase64(blob);
            }

            if (this.format === "text") {
                content = await blobToText(blob);
            }

            if (this.format === "json") {
                content = await blobToJson(blob);
            }

            if (this.format === "lotty") {
                content = await blobToLotty(blob);
            }

            cache.set(fileId, content);
            this.setContent(content);

            return content;
        } finally {
            this.setLoading(false);
        }
    }
}

export function useFileStore<TResult extends FileFormats>(
    file?: File,
    format?: TResult,
    params?: DownloadParams
): FileFormat<TResult> | undefined {
    const [store] = useState(() => new FileStore<TResult>(rootStore, file, format, params));

    useEffect(() => {
        store.load();

        return () => {
            store.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        store.setFile(file, format, params);
    }, [file, format, params, store]);

    return store.content;
}

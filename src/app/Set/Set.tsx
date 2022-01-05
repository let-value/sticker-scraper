import { Button, Grid } from "@geist-ui/react";
import { observer, useLocalObservable } from "mobx-react-lite";
import { FC, useContext, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { RouteComponentProps, useHistory } from "react-router";
import { List, Sticker, StoreContext, Toolbar, UserCard } from "../../components";
import StickerSetStore from "../../store/StickerSetStore";
import styles from "./Set.module.css";

interface Props extends RouteComponentProps<{ id?: string | undefined }> {}

const Set: FC<Props> = ({ match }) => {
    const setId = match.params.id!;

    const history = useHistory();
    const rootStore = useContext(StoreContext);

    const state = useLocalObservable(() => new StickerSetStore(rootStore, setId));
    const set = state.set;

    useEffect(() => {
        state.load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Grid.Container direction="column" justify="flex-start" alignItems="stretch">
            <Toolbar>
                {history.length ? (
                    <Grid md={0}>
                        <Button auto type="abort" iconRight={<FiArrowLeft />} onClick={history.goBack} />
                    </Grid>
                ) : (
                    false
                )}
                <Grid xs>
                    <UserCard name={set?.title} />
                </Grid>
            </Toolbar>
            <List className={styles.root}>
                <Grid.Container justify="flex-start">
                    {set?.stickers.map((sticker) => (
                        <Grid key={sticker.sticker.id} xs={24} sm={12} md={12} lg={8} xl={6} justify="center">
                            <Sticker sticker={sticker} />
                        </Grid>
                    ))}
                </Grid.Container>
            </List>
        </Grid.Container>
    );
};

export default observer(Set);
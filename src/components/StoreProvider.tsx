import { createContext, FC } from "react";
import RootStore from "../store/RootStore";

export const store = new RootStore();

export const StoreContext = createContext(store);

const StoreProvider: FC = ({ children }) => <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;

export default StoreProvider;
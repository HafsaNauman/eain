import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import store from "./store"; // default import — same as export in store.js

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

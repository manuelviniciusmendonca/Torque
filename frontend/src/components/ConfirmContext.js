import { createContext, useContext } from "react";

export const ConfirmContext = createContext(null);

export function useConfirm() {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error("useConfirm deve ser usado dentro de ConfirmProvider.");
    }
    return confirm;
}

import { useCallback, useEffect, useRef, useState } from "react";
import "./ConfirmDialog.css";
import { ConfirmContext } from "./ConfirmContext";

export function ConfirmProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const activeRequest = useRef(null);
    const queuedRequests = useRef([]);
    const cancelButtonRef = useRef(null);
    const dialogRef = useRef(null);

    const confirm = useCallback((options) => new Promise((resolve) => {
        const request = {
            title: options.title || "Confirmar ação",
            message: options.message || "",
            confirmLabel: options.confirmLabel || "Confirmar",
            cancelLabel: options.cancelLabel || "Cancelar",
            variant: options.variant || "primary",
            resolve,
            trigger: document.activeElement
        };

        if (activeRequest.current) {
            queuedRequests.current.push(request);
            return;
        }

        activeRequest.current = request;
        setDialog(request);
    }), []);

    const finish = useCallback((result) => {
        const currentRequest = activeRequest.current;
        if (!currentRequest) return;

        currentRequest.resolve(result);

        const nextRequest = queuedRequests.current.shift();
        activeRequest.current = nextRequest || null;
        setDialog(nextRequest || null);

        if (!nextRequest) {
            window.requestAnimationFrame(() => {
                if (currentRequest.trigger?.isConnected) {
                    currentRequest.trigger.focus();
                }
            });
        }
    }, []);

    useEffect(() => {
        if (dialog) cancelButtonRef.current?.focus();
    }, [dialog]);

    return (
        <ConfirmContext.Provider value={confirm}>
            <div inert={Boolean(dialog)}>
                {children}
            </div>
            {dialog && (
                <div
                    className="confirm-dialog-overlay"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) finish(false);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            event.preventDefault();
                            finish(false);
                            return;
                        }

                        if (event.key === "Tab") {
                            const buttons = dialogRef.current?.querySelectorAll("button:not([disabled])");
                            if (!buttons?.length) return;

                            const firstButton = buttons[0];
                            const lastButton = buttons[buttons.length - 1];
                            if (event.shiftKey && document.activeElement === firstButton) {
                                event.preventDefault();
                                lastButton.focus();
                            } else if (!event.shiftKey && document.activeElement === lastButton) {
                                event.preventDefault();
                                firstButton.focus();
                            }
                        }
                    }}
                >
                    <section
                        ref={dialogRef}
                        className={`confirm-dialog confirm-dialog-${dialog.variant}`}
                        role={dialog.variant === "danger" ? "alertdialog" : "dialog"}
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                        aria-describedby="confirm-dialog-message"
                    >
                        <div className="confirm-dialog-icon" aria-hidden="true">
                            {dialog.variant === "danger" ? "!" : "?"}
                        </div>
                        <div className="confirm-dialog-copy">
                            <h2 id="confirm-dialog-title">{dialog.title}</h2>
                            <p id="confirm-dialog-message">{dialog.message}</p>
                        </div>
                        <div className="confirm-dialog-actions">
                            <button
                                ref={cancelButtonRef}
                                className="confirm-dialog-button confirm-dialog-cancel"
                                type="button"
                                onClick={() => finish(false)}
                            >
                                {dialog.cancelLabel}
                            </button>
                            <button
                                className="confirm-dialog-button confirm-dialog-accept"
                                type="button"
                                onClick={() => finish(true)}
                            >
                                {dialog.confirmLabel}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

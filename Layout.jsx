
import {
    forwardRef,
    useEffect,
    useLayoutEffect,
    useState,
    useImperativeHandle,
    useCallback,
} from "react";

// Hindari warning useLayoutEffect saat SSR.
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

const STORAGE_KEY = "dual-sidebar-state";

const DEFAULT_SIDEBAR_STATE = {
    primaryHidden: false,
    secondaryHidden: false,
};

// Membaca status sidebar dari localStorage.
function getSavedSidebarState() {
    if (typeof window === "undefined") {
        return DEFAULT_SIDEBAR_STATE;
    }

    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return DEFAULT_SIDEBAR_STATE;
        }

        const parsed = JSON.parse(saved);

        return {
            primaryHidden:
                typeof parsed.primaryHidden === "boolean"
                    ? parsed.primaryHidden
                    : false,
            secondaryHidden:
                typeof parsed.secondaryHidden === "boolean"
                    ? parsed.secondaryHidden
                    : false,
        };
    } catch {
        return DEFAULT_SIDEBAR_STATE;
    }
}

/**
 * Mengembalikan offset atas sidebar (string CSS).
 * - number          -> px
 * - ref             -> bagian bawah elemen
 * - string selector -> bagian bawah elemen
 * - string CSS      -> nilai CSS langsung
 * - null/undefined  -> 0px
 */
function useHeightReference(heightReference) {
    const [height, setHeight] = useState("0px");

    useIsomorphicLayoutEffect(() => {
        if (typeof heightReference === "number") {
            setHeight(`${heightReference}px`);
            return;
        }

        let element = null;

        if (
            heightReference &&
            typeof heightReference === "object" &&
            "current" in heightReference
        ) {
            element = heightReference.current;
        } else if (
            typeof heightReference === "string" &&
            heightReference.trim()
        ) {
            const value = heightReference.trim();

            try {
                element = document.querySelector(value);
            } catch {
                // Bukan selector CSS yang valid.
            }

            if (!element) {
                const supportsHeight =
                    typeof CSS !== "undefined" &&
                    CSS.supports("height", value);

                if (supportsHeight) {
                    setHeight(value);
                } else {
                    console.warn(
                        `heightReference tidak valid: ${value}`
                    );
                    setHeight("0px");
                }

                return;
            }
        }

        if (!element) {
            setHeight("0px");
            return;
        }

        const measure = () => {
            const bottom = Math.max(
                0,
                Math.round(element.getBoundingClientRect().bottom)
            );

            const next = `${bottom}px`;

            setHeight((prev) => (prev === next ? prev : next));
        };

        let frame = null;

        const schedule = () => {
            if (frame !== null) return;

            frame = requestAnimationFrame(() => {
                frame = null;
                measure();
            });
        };

        measure();

        const observer = new ResizeObserver(schedule);
        observer.observe(element);

        window.addEventListener("scroll", schedule, {
            passive: true,
        });

        window.addEventListener("resize", schedule);

        return () => {
            observer.disconnect();

            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);

            if (frame !== null) {
                cancelAnimationFrame(frame);
            }
        };
    }, [heightReference]);

    return height;
}

const Layout = forwardRef(function Layout(
    {
        header,
        primarySidebar,
        secondarySidebar,
        footer,
        children,
        primarySidebarHeader,
        primarySidebarBody,
        secondarySidebarHeader,
        secondarySidebarBody,
        heightReference,
        adjustHeight = true,
    },
    ref
) {
    const referenceHeight = useHeightReference(
        adjustHeight ? heightReference : null
    );

    const sidebarStyle = adjustHeight
        ? {
              "--top": referenceHeight,
              "--height": `calc(100vh - ${referenceHeight})`,
          }
        : undefined;

    // Inisialisasi status dari localStorage.
    const [sidebarState, setSidebarState] = useState(
        getSavedSidebarState
    );

    const { primaryHidden, secondaryHidden } = sidebarState;

    // Simpan setiap perubahan status sidebar.
    useEffect(() => {
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(sidebarState)
            );
        } catch {
            // Abaikan jika penyimpanan tidak tersedia.
        }
    }, [sidebarState]);

    const togglePrimary = useCallback(() => {
        setSidebarState((prev) => ({
            ...prev,
            primaryHidden: !prev.primaryHidden,
        }));
    }, []);

    const toggleSecondary = useCallback(() => {
        setSidebarState((prev) => ({
            ...prev,
            secondaryHidden: !prev.secondaryHidden,
        }));
    }, []);

    const setPrimaryHidden = useCallback((hidden) => {
        setSidebarState((prev) => ({
            ...prev,
            primaryHidden:
                typeof hidden === "function"
                    ? Boolean(hidden(prev.primaryHidden))
                    : Boolean(hidden),
        }));
    }, []);

    const setSecondaryHidden = useCallback((hidden) => {
        setSidebarState((prev) => ({
            ...prev,
            secondaryHidden:
                typeof hidden === "function"
                    ? Boolean(hidden(prev.secondaryHidden))
                    : Boolean(hidden),
        }));
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            togglePrimary,
            toggleSecondary,
            setPrimaryHidden,
            setSecondaryHidden,

            getState() {
                return {
                    primaryHidden,
                    secondaryHidden,
                };
            },

            // Mengatur kedua sidebar sekaligus.
            setState(state) {
                setSidebarState((prev) => ({
                    ...prev,
                    ...state,
                }));
            },

            // Menghapus status tersimpan dan menampilkan sidebar.
            resetState() {
                setSidebarState(DEFAULT_SIDEBAR_STATE);
            },
        }),
        [
            togglePrimary,
            toggleSecondary,
            setPrimaryHidden,
            setSecondaryHidden,
            primaryHidden,
            secondaryHidden,
        ]
    );

    const primaryClass = [
        "sidebar primary-sidebar",
        "offcanvas-sm offcanvas-start",
        primaryHidden
            ? "hide border-0"
            : "border-end border-secondary-subtle",
    ].join(" ");

    const secondaryClass = [
        "sidebar secondary-sidebar",
        "offcanvas-end offcanvas-xl",
        secondaryHidden
            ? "hide border-0"
            : "border-start border-secondary-subtle",
    ].join(" ");

    return (
        <>
            {header}

            {primarySidebar ? (
                <div className="container-fluid primary-layout">
                    <div className="row">
                        <div className="col-12 p-0 d-flex">
                            <aside
                                id="primarySidebar"
                                style={sidebarStyle}
                                className={primaryClass}
                            >
                                <div className="offcanvas-header d-none">
                                    {primarySidebarHeader || (
                                        <>
                                            <h5 className="offcanvas-title">
                                                Sidebar kiri
                                            </h5>

                                            <button
                                                type="button"
                                                className="btn-close"
                                                data-bs-dismiss="offcanvas"
                                                aria-label="Close"
                                            />
                                        </>
                                    )}
                                </div>

                                <div className="offcanvas-body p-0 h-100 d-flex flex-column flex-nowrap overflow-auto">
                                    {primarySidebarBody || (
                                        <p>Primary Sidebar Content</p>
                                    )}
                                </div>
                            </aside>

                            {secondarySidebar ? (
                                <div className="main-content secondary-layout flex-grow-1 d-flex">
                                    <main className="flex-grow-1">
                                        {children}
                                    </main>

                                    <aside
                                        id="secondarySidebar"
                                        style={sidebarStyle}
                                        className={secondaryClass}
                                    >
                                        <div className="offcanvas-header d-none">
                                            {secondarySidebarHeader || (
                                                <>
                                                    <h5 className="offcanvas-title">
                                                        Sidebar kanan
                                                    </h5>

                                                    <button
                                                        type="button"
                                                        className="btn-close"
                                                        data-bs-dismiss="offcanvas"
                                                        aria-label="Close"
                                                    />
                                                </>
                                            )}
                                        </div>

                                        <div className="offcanvas-body p-0 h-100 d-flex flex-column flex-nowrap overflow-auto">
                                            {secondarySidebarBody || (
                                                <p>
                                                    Secondary Sidebar Content
                                                </p>
                                            )}
                                        </div>
                                    </aside>
                                </div>
                            ) : (
                                <main className="flex-grow-1">
                                    {children}
                                </main>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <main>{children}</main>
            )}

            {footer}
        </>
    );
});

export default Layout;

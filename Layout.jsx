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

/**
 * Mengembalikan "offset atas" sidebar (string CSS).
 * - number            -> px
 * - ref               -> bagian bawah elemen yang masih terlihat di viewport
 * - string selector   -> sama seperti ref
 * - string nilai CSS  -> dipakai langsung
 * - null/undefined    -> "0px"
 */
function useHeightReference(heightReference) {
    const [height, setHeight] = useState("0px");

    useIsomorphicLayoutEffect(() => {
        // Number
        if (typeof heightReference === "number") {
            setHeight(`${heightReference}px`);
            return;
        }

        let element = null;

        // Ref object
        if (
            heightReference &&
            typeof heightReference === "object" &&
            "current" in heightReference
        ) {
            element = heightReference.current;
        }
        // String
        else if (
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
                if (CSS.supports("height", value)) {
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

        // Ukur bagian bawah elemen yang masih terlihat di viewport.
        // Header sticky  -> nilainya tetap setinggi header.
        // Header biasa   -> mengecil sampai 0 saat di-scroll.
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

        measure(); // sebelum paint pertama -> tidak ada kedip/tumpang tindih

        const observer = new ResizeObserver(schedule);
        observer.observe(element);

        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            if (frame !== null) cancelAnimationFrame(frame);
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
    // Hook selalu dipanggil (tidak boleh di dalam if).
    const referenceHeight = useHeightReference(
        adjustHeight ? heightReference : null
    );

    const sidebarStyle = adjustHeight
        ? {
              "--top": referenceHeight,
              "--height": `calc(100vh - ${referenceHeight})`,
          }
        : undefined;

    const [primaryHidden, setPrimaryHidden] = useState(false);
    const [secondaryHidden, setSecondaryHidden] = useState(false);

    const togglePrimary = useCallback(() => {
        setPrimaryHidden((prev) => !prev);
    }, []);

    const toggleSecondary = useCallback(() => {
        setSecondaryHidden((prev) => !prev);
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            togglePrimary,
            toggleSecondary,
            setPrimaryHidden,
            setSecondaryHidden,
            getState() {
                return { primaryHidden, secondaryHidden };
            },
        }),
        [togglePrimary, toggleSecondary, primaryHidden, secondaryHidden]
    );

    // Satu border saja per sidebar; hilang saat sidebar disembunyikan.
    const primaryClass = [
        "sidebar primary-sidebar",
        "offcanvas-sm offcanvas-start",
        primaryHidden ? "hide border-0" : "border-end border-secondary-subtle",
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
                                                <p>Secondary Sidebar Content</p>
                                            )}
                                        </div>
                                    </aside>
                                </div>
                            ) : (
                                <main className="flex-grow-1">{children}</main>
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

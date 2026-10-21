
import {
    forwardRef,
    useEffect,
    useState,
    useImperativeHandle,
    useCallback,
} from "react";

function useHeightReference(heightReference) {
    const [height, setHeight] = useState("0px");

    useEffect(() => {
        if (typeof heightReference === "number") {
            setHeight(`${heightReference}px`);
            return;
        }

        if (
            heightReference &&
            typeof heightReference === "object" &&
            "current" in heightReference
        ) {
            const element = heightReference.current;

            if (!element) {
                setHeight("0px");
                return;
            }

            const updateHeight = () => {
                setHeight(`${element.getBoundingClientRect().height}px`);
            };

            updateHeight();

            const observer = new ResizeObserver(updateHeight);
            observer.observe(element);

            return () => observer.disconnect();
        }

        if (
            typeof heightReference !== "string" ||
            !heightReference.trim()
        ) {
            setHeight("0px");
            return;
        }

        const value = heightReference.trim();

        // Coba sebagai selector terlebih dahulu.
        let element = null;

        try {
            element = document.querySelector(value);
        } catch {
            // Bukan selector CSS yang valid.
        }

        if (element) {
            const updateHeight = () => {
                setHeight(`${element.getBoundingClientRect().height}px`);
            };

            updateHeight();

            const observer = new ResizeObserver(updateHeight);
            observer.observe(element);

            return () => observer.disconnect();
        }

        // Jika bukan selector, coba sebagai nilai CSS.
        if (CSS.supports("height", value)) {
            setHeight(value);
        } else {
            console.warn(
                `heightReference tidak valid: ${value}`
            );
            setHeight("0px");
        }
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
        adjustHeight = true
    },
    ref
) {
    let sidebarStyle = null;
    if (adjustHeight == true) {
        const referenceHeight = useHeightReference(heightReference);

        sidebarStyle = {
            "--top": referenceHeight,
            "--height": `calc(100vh - ${referenceHeight})`,
        };
    }

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
                return {
                    primaryHidden,
                    secondaryHidden,
                };
            },
        }),
        [
            togglePrimary,
            toggleSecondary,
            primaryHidden,
            secondaryHidden,
        ]
    );

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
                                className={[
                                    "sidebar primary-sidebar",
                                    "offcanvas-sm offcanvas-start",
                                    "border-end border-secondary-subtle",
                                    primaryHidden ? "hide" : "",
                                ].filter(Boolean).join(" ")}
                            >
                                <div className="offcanvas-header border-bottom d-none">
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
                                    {primarySidebarBody ?? (
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
                                        className={[
                                            "sidebar secondary-sidebar",
                                            "border-start offcanvas-end offcanvas-xl",
                                            "border-secondary-subtle",
                                            secondaryHidden ? "hide" : "",
                                        ].filter(Boolean).join(" ")}
                                    >
                                        <div className="offcanvas-header border-bottom d-none">
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
                                            {secondarySidebarBody ?? (
                                                <p>Secondary Sidebar Content</p>
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

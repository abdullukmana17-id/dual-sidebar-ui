import { useRef } from "react";
import Layout from "./Layout";
import "./App.css";

function App() {
  const layoutRef = useRef(null);

  return (
    <Layout
      ref={layoutRef}
      header={
        <header className="border-bottom py-3 position-sticky top-0 bg-body z-1">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                Ini Header
              </div>
            </div>
          </div>
        </header>
      }
      primarySidebar
      secondarySidebar
      adjustHeight={true}
      heightReference="header"
      primarySidebarBody={
        <>
          <section className="vh-100 bg-light border-bottom"></section>
          <section className="vh-100"></section>
        </>
      }
      secondarySidebarBody={<div>Panel detail</div>}
      adjustHeight={true}
      footer={
        <footer className="border-top vh-100">
          <div className="container">
            <div className="row">
              <div className="col-12">
                Ini Footer
              </div>
            </div>
          </div>
        </footer>
      }
    >
      <section className="p-4 min-vh-100">
        <div className="container">
          <div className="row">
            <div className="col-12 d-flex flex-wrap gap-2">

              <button
                className="btn btn-dark rounded-0"
                onClick={() => layoutRef.current?.togglePrimary()}
              >
                Toggle Sidebar Kiri
              </button>

              <button
                className="btn btn-dark rounded-0"
                onClick={() => layoutRef.current?.toggleSecondary()}
              >
                Toggle Sidebar Kanan
              </button>

              <button
                className="btn btn-dark rounded-0"
                onClick={() => layoutRef.current?.setPrimaryHidden(true)}
              >
                Sembunyikan Sidebar Kiri
              </button>

              <button
                className="btn btn-dark rounded-0"
                onClick={() => console.log(layoutRef.current?.getState())}
              >
                Lihat State Layout
              </button>
              <button className="btn btn-dark rounded-0 d-sm-none" data-bs-toggle="offcanvas" data-bs-target="#primarySidebar">Offcanfas Sidebar Kanan</button>
              <button className="btn btn-dark rounded-0 d-xl-none" data-bs-toggle="offcanvas" data-bs-target="#secondarySidebar">Offcanfas Sidebar Kanan</button>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-light vh-100 border-top"></section>
    </Layout>
  );
}

export default App;

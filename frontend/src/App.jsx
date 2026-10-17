import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import OrdensServico from "./pages/OrdensServico";
import OrdemServicoDetalhes from "./pages/OrdemServicoDetalhes";
import NovaOrdemServico from "./pages/NovaOrdemServico";
import Servicos from "./pages/Servicos";
import Pecas from "./pages/Pecas";
import Estoque from "./pages/Estoque";
import Financeiro from "./pages/Financeiro";
import Historico from "./pages/Historico";
import Retornos from "./pages/Retornos";
import Veiculos from "./pages/Veiculos";
import VeiculoDetalhes from "./pages/VeiculoDetalhes";
import { ConfirmProvider } from "./components/ConfirmDialog";

import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <ConfirmProvider>

                <div className="app-layout">

                    <Sidebar />

                <main className="main-content">

                    <Routes>

                        {/* DASHBOARD */}
                        <Route
                            path="/"
                            element={<Dashboard />}
                        />

                        {/* CLIENTES */}
                        <Route
                            path="/clientes"
                            element={<Clientes />}
                        />

                        {/* DETALHES DO CLIENTE (dados + histórico de manutenções) */}
                        <Route
                            path="/clientes/:id"
                            element={<ClienteDetalhes />}
                        />

                        {/* ORDENS DE SERVIÇO */}
                        <Route
                            path="/ordens-servico"
                            element={<OrdensServico />}
                        />

                        {/* NOVA ORDEM DE SERVIÇO (DEVE VIR ANTES DA ROTA CORINGA :id!) */}
                        <Route
                            path="/ordens-servico/nova"
                            element={<NovaOrdemServico />}
                        />

                        {/* DETALHES DA ORDEM DE SERVIÇO */}
                        <Route
                            path="/ordens-servico/:id"
                            element={<OrdemServicoDetalhes />}
                        />

                        {/* SERVIÇOS */}
                        <Route
                            path="/servicos"
                            element={<Servicos />}
                        />

                        {/* PEÇAS */}
                        <Route
                            path="/pecas"
                            element={<Pecas />}
                        />

                        <Route
                            path="/estoque"
                            element={<Estoque />}
                        />

                        {/* FINANCEIRO */}
                        <Route
                            path="/financeiro"
                            element={<Financeiro />}
                        />

                        {/* HISTÓRICO GERAL */}
                        <Route
                            path="/historico"
                            element={<Historico />}
                        />

                        {/* RETORNOS */}
                        <Route
                            path="/retornos"
                            element={<Retornos />}
                        />

                        {/* VEÍCULOS */}
                        <Route
                            path="/veiculos"
                            element={<Veiculos />}
                        />

                        {/* DETALHES DO VEÍCULO */}
                        <Route
                            path="/veiculos/:id"
                            element={<VeiculoDetalhes />}
                        />

                    </Routes>

                </main>

                </div>

            </ConfirmProvider>
        </BrowserRouter>
    );
}

export default App;
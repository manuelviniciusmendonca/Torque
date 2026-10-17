import { NavLink } from "react-router-dom";
import logo from "../../logo.png.png";

function Sidebar() {
    return (
        <aside className="sidebar">

            <div className="sidebar-logo">
                <img src={logo} alt="TORQUE" className="sidebar-logo-img" />
            </div>

            <nav className="sidebar-menu">

                <NavLink to="/">
                    Dashboard
                </NavLink>

                <NavLink to="/ordens-servico">
                    Ordens de Serviço
                </NavLink>

                <NavLink to="/clientes">
                    Clientes
                </NavLink>

                <NavLink to="/veiculos">
                    Veículos
                </NavLink>

                <NavLink to="/historico">
                    Histórico
                </NavLink>

                <NavLink to="/retornos">
                    Retornos
                </NavLink>

                <NavLink to="/servicos">
                    Serviços
                </NavLink>

                <NavLink to="/pecas">
                    Peças
                </NavLink>

                <NavLink to="/estoque">
                    Estoque
                </NavLink>

                <NavLink to="/financeiro">
                    Financeiro
                </NavLink>

            </nav>

            <div className="sidebar-bottom">

                <a href="#">
                    Configurações
                </a>

            </div>

        </aside>
    );
}

export default Sidebar;
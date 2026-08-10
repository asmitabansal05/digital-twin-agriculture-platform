import { useLocation } from "react-router-dom";

function Navbar() {
    const { pathname } = useLocation();

    // These pages manage their own headers
    if (["/digital-twin", "/simulation", "/analytics"].includes(pathname)) {
        return null;
    }

    return null;
}

export default Navbar;
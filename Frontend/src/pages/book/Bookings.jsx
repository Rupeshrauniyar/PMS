import React from "react";
import Profile from "../user/Profile";

/**
 * `/bookings` aliases cleanly to the unified Profile portfolio view
 * so users never bounce between duplicate "My Space" and "Profile" screens.
 */
const Bookings = () => <Profile />;

export default Bookings;

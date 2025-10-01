const getFullName = (employeeInfo) => {
    if (!employeeInfo) return "User";

    return [employeeInfo.firstName, employeeInfo.middleName, employeeInfo.lastName]
        .filter(Boolean)   // remove undefined, null, empty string
        .join(" ")         // join cleanly with spaces
        .trim();           // final clean-up
};

module.exports = {
    getFullName
}

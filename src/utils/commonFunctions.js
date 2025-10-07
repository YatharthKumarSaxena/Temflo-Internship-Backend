const getFullName = (employeeInfo) => {
    if (!employeeInfo || typeof employeeInfo !== "object") return "User";
    const fullName = [employeeInfo.firstName, employeeInfo.middleName, employeeInfo.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    return fullName || "User"; // fallback
};

module.exports = {
    getFullName
}

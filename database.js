const databases = [
    "settings",
    "downloads"
];
exports.setItem = (type,value) => window.localStorage.setItem(databases[type],JSON.stringify(value));
exports.getItem = (type) => JSON.parse(window.localStorage.getItem(databases[type]));
exports.clearIt = () => window.localStorage.clear();
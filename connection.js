module.exports = async (dom) => {
    setInterval(
        () =>  navigator.onLine === true ? dom.hide() : dom.show(),  
        1000
    );
}
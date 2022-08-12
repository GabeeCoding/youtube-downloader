let statusElement = document.getElementById("status")
let setStatus = (txt) => {
    statusElement.innerHTML = txt
}
setStatus("Click the buttons to download video/audio from url")
let URLBox = document.getElementById("urlbox")
let downloadbox = document.getElementById("link")

function download(format){
    //send a request to the server
    //server recieves it
    //gives us back a URL
    let url = URLBox.value
    
    if(url === ""){
        //blank url
        setStatus("URL is blank")
        return
    }
    //lets just say otherwise we can send it through
    console.log(window.location);
    let serverURL = `${window.location.origin}/getUrl`
    let resp = fetch(serverURL, {
        headers: {
            url: url,
            format: format
        }
    });
    resp.then((r) => {
        //got the response
        r.json().then(body=>{
            let pom = document.createElement('a');
            pom.setAttribute('href', body.url);
            pom.setAttribute('download', body.title);
            pom.click();
        })
    })
}
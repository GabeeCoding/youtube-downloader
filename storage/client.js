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
    setStatus("Downloading...")
    //lets just say otherwise we can send it through
    console.log(window.location);
    let serverURL = `${window.location.origin}${window.location.pathname}getUrl`
    let resp = fetch(serverURL, {
        headers: {
            url: url,
            format: format
        },
		credentials: "include",
    }).then((r) => {
        //got the response
        r.json().then(body=>{
            if(r.status !== 200){
                setStatus(body.message || "Failed to get video, status " + r.status)
                return
            }    
            //get the body
            let pom = document.createElement('a');
            pom.setAttribute('href', body.url);
            let newTitle = body.title.replace(/\./g, ' ');
            pom.setAttribute('download', newTitle);
            pom.click();
            setStatus(`Successfully got ${format} file`)
        }).catch(err => setStatus(`Failed to parse JSON`));
    }).catch((r) => setStatus(`Failed to connect to server: ${r}`));
}

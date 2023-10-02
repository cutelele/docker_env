//查看日志: "docker logs -f -n 10 emby-nginx 2>&1  | grep js:"
async function redirect2Pan(r) {
    //fetch mount emby/jellyfin file path
    const my_xiaoya_addr = "http://xxxxxxx:5678";
    const rep_text = "DOCKER_ADDRESS";
    const embyHost = 'http://172.20.0.1:8096';
    const regex = /[A-Za-z0-9]+/g;
    const itemId = r.uri.replace('emby', '').replace(/-/g, '').match(regex)[1]; 
    const mediaSourceId = r.args.MediaSourceId;
    let api_key = r.args.api_key;

    //infuse用户需要填写下面的api_key, 感谢@amwamw968
    if ((api_key === null) || (api_key === undefined)) {
        api_key = '34665a2b42e5456a9011dc2c7accc445';//这里填自己的emby/jellyfin API KEY
        r.warn(`api key for Infuse: ${api_key}`);
    }

    const itemInfoUri = `${embyHost}/Items/${itemId}/PlaybackInfo?MediaSourceId=${mediaSourceId}&api_key=${api_key}`;
    r.warn(`itemInfoUri: ${itemInfoUri}`);
    const embyRes = await fetchEmbyFilePath(itemInfoUri);
    if (embyRes.startsWith('error')) {
        r.error(embyRes);
        r.return(500, embyRes);
        return;
    }
    r.warn(`mount emby file path: ${embyRes}`);

    if (!embyRes.startsWith('error')) {
        r.warn(`redirect to: ${embyRes}`);
        if(my_xiaoya_addr!=""&&rep_text!=""){
            embyRes = embyRes.replace(rep_text, my_xiaoya_addr);
        }
        r.return(302, embyRes);
        return;
    }
    if (embyRes.startsWith('error401')) {
        r.error(embyRes);
        r.return(401, embyRes);
        return;
    }
    if (embyRes.startsWith('error404')) {
        r.error(embyRes);
        r.return(404, embyRes);
        return;
    }
    r.warn(`not found direct ${alistRes}`);
    r.internalRedirect("@backend");
    return;
}
async function fetchEmbyFilePath(itemInfoUri) {
    try {
        const res = await ngx.fetch(itemInfoUri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Content-Length': 0,
            },
            max_response_body_size: 65535,
        });
        if (res.ok) {
            const result = await res.json();
            if (result === null || result === undefined) {
                return `error: emby_api itemInfoUri response is null`;
            }
            return result.MediaSources[0].Path;
        }
        else {
            return (`error: emby_api ${res.status} ${res.statusText}`);
        }
    }
    catch (error) {
        return (`error: emby_api fetch mediaItemInfo failed,  ${error}`);
    }
}
export default { redirect2Pan };
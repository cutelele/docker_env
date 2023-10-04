//查看日志: "docker logs -f -n 10 emby-nginx 2>&1  | grep js:"
async function redirect2Pan(r) {

    //多个地址负载均衡,地址之间请用“|”隔开 例:const my_xiaoya_addr = "http://aaaaaa:5678|http://bbbbb:5678";注意最后的地址不要带“|”
    const my_xiaoya_addr = "http://xxxxxxx:5678";//默认兼容单地址方式,如需关闭地址转换此处请留空 例: const my_xiaoya_addr = "";
    const rep_text = "DOCKER_ADDRESS";//如需关闭地址转换此处请留空 例: const rep_text = "";
    //以上两处变量同时配置,方可启用地址转换功能.
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
    let embyRes = await fetchEmbyFilePath(itemInfoUri);
    if (embyRes.startsWith('error')) {
        r.error(embyRes);
        r.return(500, embyRes);
        return;
    }
    r.warn(`mount emby file path: ${embyRes}`);

    if (!embyRes.startsWith('error')) {
        if(my_xiaoya_addr!=""&&rep_text!=""){//此处判断是否需要地址转换
            if (embyRes.indexOf(rep_text)!=-1){
                let addrs = my_xiaoya_addr.split("|");
                let randomIndex = Math.floor(Math.random() * addrs.length);//随机方式负载均衡
                embyRes = embyRes.replace(rep_text, addrs[randomIndex]);
                r.warn(`redirect to 302: ${embyRes}`);
                r.return(302, embyRes);
                return;
            }else{//兼容emby本地库,不做302跳转
                r.warn(`redirect to 200: ${r}`);
                return ngx.fetch(r);
            }
        }
        //运行到此处说明用户自己搞定了.strm内容替换,这里直接302,如果这种情况下还需要对emby本地库进行支持,建议走转换配置
        //把my_xiaoya_addr和rep_text配置成和strm文件一致的地址前缀,利用不改变strm实际内容但又跑了转换逻辑,达到筛选出emby本地库并进行支持的目的.
        r.warn(`redirect not trans to 302: ${embyRes}`);
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
let oriData = '';

function HeaderFilter(r) {
    r.headersOut['Content-Length'] = null;
}
const incloudUrl = (r, data, flags) => {
	   oriData += data;
    if (flags.last) {
		oriData+=`<script type="text/javascript" src="externalPlayer.js"></script>`;
        r.sendBuffer(oriData, flags);
		r.done();
    }
}
export default {HeaderFilter,incloudUrl};
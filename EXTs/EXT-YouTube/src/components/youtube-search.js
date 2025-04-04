/** Youtube search
 * Based from : https://github.com/damonwonghv/youtube-search-api
 * Adapted and simplified for EXT-YouTube using
 * @bugsounet
 **/

const GetYoutubeInitData = async (url) => {
  var initdata = {};
  try {
    const request = await fetch(encodeURI(url));
    const page = await request.text();
    const ytInitData = page.split("var ytInitialData =");

    if (ytInitData && ytInitData.length > 1) {
      const data = ytInitData[1].split("</script>")[0].slice(0, -1);

      initdata = JSON.parse(data);
      return Promise.resolve({ initdata });
    } else {
      console.error("[YT] [Search] cannot_get_init_data");
      return Promise.reject("cannot_get_init_data");
    }
  } catch (ex) {
    console.error("[YT] [Search] [GetYoutubeInitData]", ex);
    return Promise.reject(ex);
  }
};

const GetData = async (keyword, limit = 0) => {
  let endpoint = `https://www.youtube.com/results?search_query=${keyword}&sp=EgIQAQ%3D%3D`;
  try {
    const page = await GetYoutubeInitData(endpoint);

    const sectionListRenderer = page.initdata.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer;
    let items = [];

    await sectionListRenderer.contents.forEach((content) => {
      if (content.itemSectionRenderer) {
        content.itemSectionRenderer.contents.forEach((item) => {
          let videoRender = item.videoRenderer;
          if (videoRender && videoRender.videoId) items.push(VideoRender(videoRender));
        });
      }
    });
    const itemsResult = limit !== 0 ? items.slice(0, limit) : items;
    return await Promise.resolve({
      items: itemsResult
    });
  } catch (ex) {
    return await Promise.reject(ex);
  }
};

const VideoRender = (json) => {
  try {
    const id = json.videoId;
    const thumbnail = json.thumbnail.thumbnails[0];
    const title = json.title.runs[0].text;
    return {
      id,
      title,
      thumbnail
    };
  } catch (ex) {
    console.error("[YT] [Search] [VideoRender]", ex);
    throw ex;
  }
};

exports.search = GetData;

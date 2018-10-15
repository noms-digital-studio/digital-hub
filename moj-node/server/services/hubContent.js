const {
  prop,
  filter,
  propEq,
  not,
} = require('ramda');

module.exports = function createHubContentService(repository) {
  async function contentFor(id) {
    const result = await repository.contentFor(id);
    const type = prop('type', result);

    switch (type) {
      case 'radio':
      case 'video':
        return media(result);
      case 'landing-page':
        return landingPage(result);
      default:
        return result;
    }
  }

  async function media(data) {
    const id = prop('id', data);
    const seriesId = prop('seriesId', data);

    const series = await repository.termFor(seriesId);
    const season = await repository.seasonFor(seriesId);
    const filterOutCurrentEpisode = filter(item => not(propEq('id', id, item)));

    return {
      ...data,
      seriesName: prop('name', series),
      season: season ? filterOutCurrentEpisode(season) : season,
    };
  }

  async function landingPage(data) {
    const id = prop('id', data);
    const featuredId = prop('featuredId', data);

    const featuredContent = await epository.contentFor(featuredId);

    return {
      ...data,
      featuredId: 'featuredId',
      featuredTitle: 'featured foo',
      featuredType: 'radio',
      featuredThumb: 'foo.png',
      featuredSummary: 'foo summary',
      featuredUrl: 'foo.com',
    };
  }

  return {
    contentFor,
  };
};

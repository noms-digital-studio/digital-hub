const express = require('express');
const { path } = require('ramda');

const fixUrls = element => {
  const { id, description, href, linkText } = element;
  switch (element.href) {
    // TODO: Re-enable when IEP personalization feature released
    // case '/content/4204':
    //   return { id, description, href: '/iep', linkText };
    default:
      return { id, description, href, linkText };
  }
};

const createTopicsRouter = ({ logger, hubMenuService, analyticsService }) => {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      logger.info('GET index');

      const notification = path(['session', 'notification'], req);
      const userName = path(['session', 'user', 'name'], req);
      const newDesigns = path(['locals', 'features', 'newDesigns'], res);
      const establishmentId = path(['locals', 'establishmentId'], res);
      const matomoUrl = path(['app', 'locals', 'config', 'matomoUrl'], req);

      const topics = await hubMenuService.allTopics(establishmentId);

      const config = {
        content: false,
        header: false,
        postscript: true,
        detailsType: 'small',
        userName,
        newDesigns,
        matomoUrl,
      };
      analyticsService.sendPageTrack({
        hostname: req.hostname,
        page: '/topics',
        title: 'Browse the Content Hub',
      });

      res.render('pages/topics', {
        title: 'Browse the Content Hub',
        notification,
        allTopics: topics.map(fixUrls),
        config,
      });
    } catch (exception) {
      next(exception);
    }
  });

  return router;
};

module.exports = {
  createTopicsRouter,
};

const { prop, path } = require('ramda');
const express = require('express');
const { relativeUrlFrom } = require('../utils');

const StandardClient = require('../clients/standard');

module.exports = function createContentRouter({
  hubContentService,
  logger,
  requestClient = new StandardClient(),
}) {
  const router = express.Router();

  router.get('/:id', async (req, res, next) => {
    const { id } = req.params;

    logger.info(`GET /${id}`);

    if (!id) {
      return next();
    }

    const userName = path(['session', 'user', 'name'], req);
    const newDesigns = path(['locals', 'features', 'newDesigns'], res);

    const config = {
      content: true,
      header: false,
      postscript: false,
      detailsType: 'small',
      newDesigns,
      userName,
      returnUrl: req.originalUrl,
    };

    const establishmentId = path(['locals', 'establishmentId'], res);
    const backendUrl = path(['app', 'locals', 'envVars', 'backendUrl'], req);

    try {
      const data = await hubContentService.contentFor(id, establishmentId);
      const contentType = prop('contentType', data);

      switch (contentType) {
        case 'radio':
          return res.render('pages/audio', {
            title: data.title,
            config,
            data,
          });
        case 'video':
          return res.render('pages/video', {
            title: data.title,
            config,
            data,
          });
        case 'page':
          config.content = false;

          return res.render('pages/flat-content', {
            title: data.title,
            config,
            data,
          });
        case 'landing-page':
          config.postscript = true;

          return res.render('pages/category', {
            title: data.title,
            config,
            data,
          });
        case 'pdf': {
          const url = relativeUrlFrom(data.url, backendUrl);
          logger.info('PROD - Sending PDF to client from:', url);
          const stream = await requestClient.get(url, {
            responseType: 'stream',
          });

          // X-Download-Options prevents Internet Explorer from executing downloads
          // in your site’s context. We don't want that
          res.removeHeader('X-Download-Options');
          res.type('application/pdf');

          stream.on('error', next);

          return stream.pipe(res);
        }
        default:
          // send to the 404 page
          return next();
      }
    } catch (exp) {
      return next(exp);
    }
  });

  return router;
};

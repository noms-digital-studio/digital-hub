// eslint-disable-next-line import/order
const config = require('../server/config');

const express = require('express');
const addRequestId = require('express-request-id')();
const compression = require('compression');
const helmet = require('helmet');
const log = require('bunyan-request-logger')({ name: config.appName });
const nunjucks = require('nunjucks');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');
const session = require('cookie-session');
const bodyParser = require('body-parser');

const { createIndexRouter } = require('./routes/index');
const { createTopicsRouter } = require('./routes/topics');
const { createTimetableRouter } = require('./routes/timetable');
const { createHealthRouter } = require('./routes/health');
const { createContentRouter } = require('./routes/content');
const { createVisitsRouter } = require('./routes/visits');
const { createIepRouter } = require('./routes/iep');
const { createMoneyRouter } = require('./routes/money');
const { createTagRouter } = require('./routes/tags');
const { createGamesRouter } = require('./routes/games');
const { createAnalyticsRouter } = require('./routes/analytics');
const { createGettingAJobRouter } = require('./routes/gettingAJob');
const { createSearchRouter } = require('./routes/search');

const { featureToggleMiddleware } = require('./middleware/featureToggle');
const {
  configureEstablishment,
} = require('./middleware/configureEstablishment');

const { getEstablishmentId, getGoogleAnalyticsId } = require('./utils');

const version = Date.now().toString();

const createApp = ({
  appInfo,
  logger,
  hubFeaturedContentService,
  hubMenuService,
  hubContentService,
  hubTagsService,
  healthService,
  offenderService,
  searchService,
  analyticsService,
}) => {
  const app = express();

  const appViews = [
    path.join(__dirname, '../node_modules/govuk-frontend/'),
    path.join(__dirname, '/views/'),
  ];

  // View Engine Configuration
  app.set('views', path.join(__dirname, '../server/views'));
  app.set('view engine', 'html');
  nunjucks.configure(appViews, {
    express: app,
    autoescape: true,
  });

  app.set('json spaces', 2);

  // Configure Express for running behind proxies
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true);

  // Server Configuration
  app.set('port', process.env.PORT || 3000);

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  app.use(helmet());

  app.use(addRequestId);

  app.use(log.requestLogger());

  // Resource Delivery Configuration
  app.use(compression());

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  if (config.production) {
    // Version only changes on reboot
    app.locals.version = version;
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString();
      return next();
    });

    app.use(
      '/public',
      sassMiddleware({
        src: path.join(__dirname, '../assets/sass'),
        dest: path.join(__dirname, '../assets/stylesheets'),
        debug: true,
        outputStyle: 'compressed',
        prefix: '/stylesheets/',
      }),
    );
  }

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration * 1000 };

  app.use(
    session({
      secret: config.cookieSecret,
      resave: false,
      saveUninitialized: true,
      maxAge: 4.32e7, // 12 Hours
    }),
  );

  [
    '../public',
    '../assets',
    '../assets/stylesheets',
    '../node_modules/govuk-frontend/govuk/',
    '../node_modules/jplayer/dist',
    '../node_modules/jquery/dist',
  ].forEach(dir => {
    app.use('/public', express.static(path.join(__dirname, dir), cacheControl));
  });

  app.use(
    '/assets',
    express.static(
      path.join(__dirname, '../node_modules/govuk-frontend/govuk/assets'),
      cacheControl,
    ),
  );

  // GovUK Template Configuration
  const establishmentId = getEstablishmentId(config.establishmentName);
  app.locals.asset_path = '/public/';
  app.locals.config = {
    ...config,
    establishmentId,
    gaId: getGoogleAnalyticsId(establishmentId),
  };

  // Don't cache dynamic resources
  app.use(helmet.noCache());

  // feature toggles
  app.use(featureToggleMiddleware(config.features));

  // establishment toggle
  app.use(
    configureEstablishment({
      shouldAllowSwitch: config.features.prisonSwitch === 'true',
    }),
  );

  // Health end point
  app.use('/health', createHealthRouter({ appInfo, healthService }));

  app.use(
    '/',
    createIndexRouter({
      logger,
      hubFeaturedContentService,
    }),
  );

  app.use(
    '/topics',
    createTopicsRouter({
      logger,
      hubMenuService,
    }),
  );

  if (config.features.newDesigns) {
    app.use(
      '/timetable',
      createTimetableRouter({
        logger,
        offenderService,
      }),
    );

    app.use(
      '/visits',
      createVisitsRouter({
        hubContentService,
        offenderService,
        logger,
      }),
    );

    app.use(
      '/iep',
      createIepRouter({
        hubContentService,
        offenderService,
        logger,
      }),
    );

    app.use(
      '/money',
      createMoneyRouter({
        hubContentService,
        offenderService,
        logger,
      }),
    );
  }

  app.use(
    '/content',
    createContentRouter({
      logger,
      hubContentService,
      analyticsService,
    }),
  );

  app.use(
    '/tags',
    createTagRouter({
      logger,
      hubTagsService,
    }),
  );

  app.use('/games', createGamesRouter({ logger }));
  app.use('/analytics', createAnalyticsRouter({ analyticsService, logger }));
  app.use(
    ['/working-in-wayland', '/working-in-berwyn'],
    createGettingAJobRouter({ logger, hubContentService, hubMenuService }),
  );
  app.use('/search', createSearchRouter({ logger, searchService }));

  app.use('*', (req, res) => {
    res.status(404);
    res.render('pages/404');
  });

  app.use(renderErrors);

  // eslint-disable-next-line no-unused-vars
  function renderErrors(error, req, res, next) {
    logger.error(error, 'Unhandled error');

    res.status(error.status || 500);

    const locals = {
      message: 'Sorry, there is a problem with this service',
      stack: '',
    };
    if (error.expose || config.dev) {
      locals.message = error.message;
    }
    if (config.dev) {
      locals.stack = error.stack;
      locals.req_id = req.id;
    }

    res.render('pages/error', locals);
  }

  return app;
};

module.exports = {
  createApp,
};

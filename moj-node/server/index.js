const createApp = require('./app');
const logger = require('../log');
const config = require('./config');

const HubClient = require('./clients/hub');

const appInfoService = require('./services/appInfo');
const createDemoDataService = require('./services/demoDataService');
const createHubMenuService = require('./services/hubMenu');
const createHubFeaturedContentService = require('./services/hubFeaturedContent');
const createHubPromotedContentService = require('./services/hubPromotedContent');
const createHubContentService = require('./services/hubContent');

const featuredContentRepository = require('./repositories/hubFeaturedContent');
const promotedContentRepository = require('./repositories/hubPromotedContent');
const hubMenuRepository = require('./repositories/hubMenu');
const contentRepository = require('./repositories/hubContent');

const buildInfo = config.dev ? null : require('../build-info.json'); // eslint-disable-line import/no-unresolved

// pass in dependencies of service
const demoDataService = createDemoDataService();
const hubMenuService = createHubMenuService(
  hubMenuRepository(
    new HubClient(),
  ),
);
const hubFeaturedContentService = createHubFeaturedContentService(
  featuredContentRepository(
    new HubClient(),
  ),
);
const hubPromotedContentService = createHubPromotedContentService(
  promotedContentRepository(
    new HubClient(),
  ),
);

const hubContentService = createHubContentService(
  contentRepository(
    new HubClient(),
  ),
);

const app = createApp({
  appInfo: appInfoService(buildInfo),
  demoDataService,
  logger,
  hubFeaturedContentService,
  hubPromotedContentService,
  hubMenuService,
  hubContentService,
});

module.exports = app;

const request = require('supertest');
const cheerio = require('cheerio');

const createIndexRouter = require('../../server/routes/index');
const { setupBasicApp, logger, consoleLogError } = require('../test-helpers');

describe('GET /', () => {
  let featuredItem;
  let hubFeaturedContentService;
  let hubPromotedContentService;
  let hubMenuService;
  let router;
  let app;

  beforeEach(() => {
    featuredItem = {
      id: 1,
      title: 'foo title',
      contentType: 'foo',
      summary: 'foo summary',
      image: {
        alt: 'Foo image alt text',
        url: 'image.url.com',
      },
      duration: '40:00',
    };

    hubFeaturedContentService = {
      hubFeaturedContent: sinon.stub().returns({
        newsAndEvents: [{ ...featuredItem, title: 'News story', id: 0 }],
        music: [{ ...featuredItem, title: 'Foo radio show', id: 1 }],
        healthyMindAndBody: [{ ...featuredItem, id: 2 }],
        inspiration: [{ ...featuredItem, id: 3 }],
        scienceAndNature: [{ ...featuredItem, id: 4 }],
        artAndCulture: [{ ...featuredItem, id: 5 }],
        history: [{ ...featuredItem, id: 6 }],
        legalAndYourRights: [{ ...featuredItem, id: 7 }],
      }),
    };

    hubPromotedContentService = {
      hubPromotedContent: sinon.stub().returns({
        ...featuredItem,
        title: 'foo promoted content',
        summary: 'foo promoted summary',
        contentUrl: 'foo.content.url',
      }),
    };

    hubMenuService = {
      tagsMenu: sinon
        .stub()
        .returns([
          { linkText: 'Some Foo Link', href: '/content/someFooLink' },
          { linkText: 'Bar', href: '/content/2' },
        ]),
      homepageMenu: sinon.stub().returns([
        {
          title: 'Some cool content link',
          href: '/content/someId',
        },
      ]),
    };
  });

  describe('Homepage', () => {
    beforeEach(() => {
      router = createIndexRouter({
        logger,
        hubFeaturedContentService,
        hubPromotedContentService,
        hubMenuService,
      });

      app = setupBasicApp();
      app.use((req, res, next) => {
        req.session = {};
        next();
      });
      // app.use(authMiddleware(), createUserSession({ offenderService }));
      app.use(router);
      app.use(consoleLogError);
    });

    it('renders promoted content', () => {
      return request(app)
        .get('/')
        .expect(200)
        .then(response => {
          const $ = cheerio.load(response.text);

          expect($('[data-promoted-item-text]').text()).to.include(
            'foo promoted content',
            'Incorrect title rendered',
          );
          expect($('[data-promoted-item-text]').text()).to.include(
            'foo promoted summary',
            'Incorrect description rendered',
          );
          expect($('[data-promoted-item-background]').attr('style')).to.include(
            'image.url.com',
            'Incorrect image rendered',
          );

          expect($('[data-call-to-action]').attr('href')).to.include(
            'foo.content.url',
            'Incorrect content url rendered',
          );
        });
    });

    it('renders featured content', () => {
      return request(app)
        .get('/')
        .expect(200)
        .then(response => {
          const $ = cheerio.load(response.text);
          const radioItemSelector =
            '[data-featured-item-id="featured-content-1"]';
          expect($('[data-featured-item-id]').length).to.equal(
            8,
            '8 featured items should be rendered',
          );
          expect($(radioItemSelector).text()).to.include(
            'Foo radio show',
            'Correct title rendered',
          );
          expect($(radioItemSelector).text()).to.include(
            'foo summary',
            'Correct description rendered',
          );
          expect(
            $(`${radioItemSelector} [data-featured-item-background]`).attr(
              'style',
            ),
          ).to.include('image.url.com', 'Correct image rendered');
          expect(
            $(`${radioItemSelector} [data-featured-item-duration]`).text(),
          ).to.include('40:00', 'Correct duration rendered');
        });
    });

    it('renders a homepage menu', () => {
      return request(app)
        .get('/')
        .expect(200)
        .then(response => {
          const $ = cheerio.load(response.text);

          expect($('#homepage-navigation li').length).to.equal(
            2,
            'should have rendered a homepage navigation',
          );

          expect($('#homepage-navigation').text()).to.include(
            'Some cool content link',
            'should have rendered the correct content on the homepage navigation',
          );

          expect($('#homepage-navigation').html()).to.include(
            '/content/someId',
            'should have rendered the correct links on the homepage navigation',
          );
        });
    });

    it('renders a 500 when there is an error', () => {
      const hubFeaturedContentServiceFailure = {
        hubFeaturedContent: sinon.stub().throws('boom'),
      };

      router = createIndexRouter({
        logger,
        hubFeaturedContentService: hubFeaturedContentServiceFailure,
        hubPromotedContentService,
        hubMenuService,
      });
      app = setupBasicApp();

      app.use(router);

      return request(app)
        .get('/')
        .expect(500);
    });

    it('renders the browse by topics menu', () => {
      return request(app)
        .get('/')
        .then(response => {
          const $ = cheerio.load(response.text);

          expect($('#browser-by-topic h2').text()).to.equal('Browse by topic');
          expect($('#browser-by-topic .govuk-hub-topics li').length).to.equal(
            2,
            'Correct number of menu items',
          );

          expect($('#browser-by-topic').text()).to.include(
            'Some Foo Link',
            'Should have rendered the correct text data on the tags menu',
          );

          expect($('#browser-by-topic').html()).to.include(
            '/content/someFooLink',
            'Should have rendered the correct links data on the tags menu',
          );
        });
    });
  });
});

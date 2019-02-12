var commentBox = document.querySelector('[data-item-comment-box]');
var feedbackText = document.querySelector('[data-item-feedback-text]');
var startTime = Date.now();
var types = {
  video: 'video',
  radio: 'podcast',
  page: 'article',
};

document.body.addEventListener('click', function(event) {
  if (event.target.matches('[data-item-feedback]')) {
    var details = {
      name: generateEventName(event.target),
      category: types[event.target.getAttribute('data-item-category')],
      action: event.target.getAttribute('data-item-action'),
      value: event.target.getAttribute('data-item-value'),
    };

    var isActive = event.target.classList.contains('is-selected');

    clearFeedbackText();

    if (isActive) {
      hideCommentBoxForm();
      deselectThumbs();
      sendUnSelectFeedbackEvent(details);
    } else {
      deselectThumbs();
      updateFeedbackText(details.action, details.category);
      sendFeedbackEvent(details);
      selectThumb(event.target);
      updateCommentBoxDetails(details);
      revealCommentBoxForm();
    }
  }

  return false;
});

document.body.addEventListener('submit', function(event) {
  if (event.target.matches('[data-item-comment]')) {
    event.preventDefault();
    var action = event.target.getAttribute('data-item-action');
    var comment = event.target.querySelector('textarea').value;
    var details = {
      name: event.target.getAttribute('data-item-name'),
      category: event.target.getAttribute('data-item-category'),
      action: action + ' - ' + comment,
      value: event.target.getAttribute('data-item-value'),
    };

    sendFeedbackEvent(details);
    disableFormSubmit(event.target);
    setTimeout(function() {
      hideCommentBoxForm();
      enableFormSubmit(event.target);
    }, 1500);
  }

  return false;
});

if (commentBox) {
  commentBox.addEventListener('keyup', handleTextBoxInput);
  commentBox.addEventListener('paste', function(event) {
    setTimeout(function() {
      handleTextBoxInput(event);
    }, 1);
  });
}

function generateEventName(element) {
  // title | PageURL | Like/DISLIKE | Time/Date | ContentType | Series | Time take react | visitor ID
  var name = [
    element.getAttribute('data-item-name'),
    window.location.pathname,
    element.getAttribute('data-item-action'),
    Date.now(),
    types[element.getAttribute('data-item-category')],
    element.getAttribute('data-item-series'),
    calculateTimeToAction(),
    getVisitorId(),
  ];

  return name.join('|');
}

function calculateTimeToAction() {
  return Math.floor((Date.now() - startTime) / 1000);
}

function getVisitorId() {
  var visitor_id;
  _paq.push([
    function() {
      visitor_id = this.getVisitorId();
    },
  ]);
  return visitor_id || 'ID_NOT_FOUND';
}

function sendFeedbackEvent(config) {
  if (!_paq) return;

  var event = ['trackEvent', config.category, config.action, config.name];

  if (config.value) {
    event.push(config.value);
  }

  _paq.push(event);
}

function sendUnSelectFeedbackEvent(config) {
  var newConfig = Object.assign(config, {
    action: 'UN' + config.action,
    value: '0',
  });

  sendFeedbackEvent(newConfig);
}

function handleTextBoxInput(event) {
  var characterCountElem = document.querySelector('[data-item-counter]');
  var charCount = commentBox.value.length;
  var charMax = commentBox.getAttribute('maxlength');

  characterCountElem.textContent = charMax - charCount;
}

function updateCommentBoxDetails(details) {
  var commentBoxForm = document.querySelector('[data-item-comment]');

  if (!commentBoxForm) return;

  commentBoxForm.setAttribute('data-item-name', details.name);
  commentBoxForm.setAttribute('data-item-category', details.category);
  commentBoxForm.setAttribute('data-item-action', details.action);
  commentBoxForm.setAttribute('data-item-value', details.value);
}

function revealCommentBoxForm() {
  var commentBoxForm = document.querySelector('[data-item-comment]');

  if (!commentBoxForm) return;

  commentBoxForm.classList.remove('govuk-u-hidden');
}

function selectThumb(element) {
  element.classList.add('is-selected');
}

function deselectThumbs() {
  var thumbs = document.querySelectorAll('[data-item-feedback]');

  Array.from(thumbs).forEach(function(thumb) {
    thumb.classList.remove('is-selected');
  });
}

function hideCommentBoxForm() {
  var commentBoxForm = document.querySelector('[data-item-comment]');

  if (!commentBoxForm) return;
  commentBoxForm.querySelector('textarea').value = '';
  commentBoxForm.classList.add('govuk-u-hidden');
  handleTextBoxInput();
}

function clearFeedbackText() {
  feedbackText.textContent = '';
}

function updateFeedbackText(feedback, type) {
  if (feedback === 'LIKE') {
    feedbackText.textContent = 'I like this ' + type;
  } else {
    feedbackText.textContent = 'I do not like this ' + type;
  }
}

function disableFormSubmit(element) {
  element.querySelector('button').setAttribute('disabled', 'true');
}

function enableFormSubmit(element) {
  element.querySelector('button').removeAttribute('disabled');
}
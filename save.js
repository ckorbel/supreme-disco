import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { defineMessages, injectIntl, intlShape } from 'react-intl';

import { checkForLessonError, isSubscribed } from '../../../../utils/curriculum-utils';
import { getLessons } from '../../../../actions/lessons';

import activateOptimize from '../../../../utils/google-optimize-utils';
import Curriculum from '../../../../components/Curriculum';
import Head from '../../../../components/Head';

const messages = defineMessages({
  lessonTitle: {
    id: 'playlist.title',
    defaultMessage: '{title} | Lessons | Fender Play',
  },
  lessonDescription: {
    id: 'playlist.description',
    defaultMessage: 'In this lesson we learn {description}',
  },
  lesson: {
    id: 'lesson.lesson',
    defaultMessage: 'Lesson',
  },
});

class Lesson extends PureComponent {
  async componentDidMount() {
    const {
      checkForSession,
      currentLesson,
      fenderConnect,
      lessonSlug,
      setCurrentLesson,
    } = this.props;

    await checkForSession();
    await setCurrentLesson(lessonSlug, !isSubscribed(fenderConnect));

    activateOptimize();
    checkForLessonError(currentLesson);
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.fenderConnect.subscriptions.play !== this.props.fenderConnect.subscriptions.play) {
      const { setCurrentLesson } = this.props;
      const subscribed = nextProps.fenderConnect.subscriptions.play !== 'cancelled';
      setCurrentLesson(this.props.lessonSlug, !subscribed);
    }
    if (nextProps.lessonSlug !== this.props.lessonSlug) {
      this.props.setCurrentLesson(nextProps.lessonSlug);
    }
  }

  componentWillUnmount() {
    this.props.clearWatching();
  }

  getParsedTitle = (url) => {
    const newTitle = url.replace(/-/g, ' ');
    const formattedTitle = newTitle.split(' ')
      .map((letter) => letter.charAt(0).toUpperCase() + letter.substring(1))
      .join(' ');
    return formattedTitle;
  }

  getMetaData = () => {
    const { intl, lessonSlug } = this.props;
    if (!lessonSlug) {
      return null; 
    }
    const title = this.getParsedTitle(lessonSlug);
    const { formatMessage } = intl;
    const url = `lessons/${lessonSlug}`;
    const schema = {
      '@context': 'http://schema.org/',
      '@type': 'Course',
      name: title,
      description: formatMessage(messages.lessonDescription, { description: title }),
      'schema:provider': {
        '@type': 'schema:Organization',
        'schema:name': 'Fender Play',
        'schema:url': `${process.env.CLIENT_FENDER_COM}${url}`,
      },
    };
    const metaData = Head.generateMetaData(
      formatMessage(messages.lessonTitle, { title }),
      formatMessage(messages.lessonDescription, { description: title }),
      url,
      null,
      schema
    );

    return <Head {...metaData}/>
    
  }

  render() {
    const {
      currentLesson,
      fenderConnect,
      isSkillsTabEnabled,
      myProgress,
      song,
      updateLessonProgress,
      updateLessonStandaloneProgress,
    } = this.props;
    return (
      <div className="lesson">
      {this.getMetaData()}
        <Curriculum
          options={{
            email: fenderConnect.email,
            isSkillsTabEnabled,
            isSubscribed: isSubscribed(fenderConnect),
            lesson: currentLesson,
            messages,
            myProgress,
            song,
            type: 'lesson',
            updateLessonProgress,
            updateLessonStandaloneProgress,
            userID: fenderConnect.userID,
          }}
        />
      </div>
    );
  }
}

Lesson.fetchData = ({ store, props }) => store.dispatch(getLessons({ slug: props.lessonSlug }));

Lesson.propTypes = {
  checkForSession: PropTypes.func.isRequired,
  clearWatching: PropTypes.func.isRequired,
  currentLesson: PropTypes.shape({}),
  fenderConnect: PropTypes.shape({
    subscriptions: PropTypes.shape({
      play: PropTypes.string,
    }).isRequired,
  }).isRequired,
  intl: intlShape.isRequired,
  isSkillsTabEnabled: PropTypes.bool,
  lessonSlug: PropTypes.string.isRequired,
  myProgress: PropTypes.shape({
    lessons: PropTypes.shape({}),
  }),
  setCurrentLesson: PropTypes.func.isRequired,
  song: PropTypes.shape({}),
  updateLessonProgress: PropTypes.func.isRequired,
  updateLessonStandaloneProgress: PropTypes.func.isRequired,
};

Lesson.defaultProps = {
  currentLesson: null,
  isSkillsTabEnabled: null,
  myProgress: null,
  relatedLessons: [],
  song: null,
};

export default injectIntl(Lesson);
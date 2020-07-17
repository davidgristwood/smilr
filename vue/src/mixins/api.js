// ----------------------------------------------------------------------------
// Copyright (c) Ben Coleman, 2020
// Licensed under the MIT License.
//
// Axios based API client for all calls to data service API
// ----------------------------------------------------------------------------

/* eslint-disable no-console */
import axios from 'axios'
import router from '../router'
import auth from './auth'

export default {
  methods: {
    //
    // ===== Events =====
    //
    apiGetAllEvents: function() {
      return this._apiRawCall('events')
    },

    apiGetEvent: function(id) {
      return this._apiRawCall(`events/${id}`)
    },

    apiGetEventsFiltered: function(time) {
      return this._apiRawCall(`events/filter/${time}`)
    },

    apiGetFeedbackForEvent: function(event) {
      let calls = []
      let apifeedback = []

      for (let topic of event.topics) {
        calls.push(axios.get(`${this.$config.API_ENDPOINT}/feedback/${event._id}/${topic.id}`))
      }

      // I only partially understand what this is doing
      // It should be waiting for all API calls to complete
      axios.all(calls)
        .then(axios.spread((...allResponses) => {
          for (let resp of allResponses) {
            for (let data of resp.data) {
              apifeedback.push(data)
            }
          }
        }))

      return apifeedback
    },

    apiDeleteEvent: function(event) {
      return this._apiRawCall(`events/${event._id}`, 'delete')
    },

    apiUpdateEvent: function(event) {
      return this._apiRawCall(`events/${event._id}`, 'put', event)
    },

    apiCreateEvent: function(event) {
      return this._apiRawCall('events', 'post', event)
    },

    //
    // ===== Feedback =====
    //

    apiPostFeedback: function(feedbackData) {
      return this._apiRawCall('feedback', 'post', feedbackData)
    },

    //
    // ===== Private methods =====
    //

    _apiRawCall: function(apiPath, method = 'get', data = null) {
      // !IMPORTANT! Special stub of all API calls when running unit tests
      if (process.env.NODE_ENV === 'test') { return new Promise((resolve) => { resolve([]) }) }

      let apiUrl = `${this.$config.API_ENDPOINT}/${apiPath}`

      let headers = {}
      // Send token as per the OAuth 2.0 bearer token scheme
      if (auth && auth.data() && auth.data().accessToken) {
        headers = {
          'Authorization': `Bearer ${auth.data().accessToken}`
        }
      }
      // console.log('### API CALL '+ apiUrl)
      // console.log('### API HEADERS ', headers)

      return axios({
        method: method,
        url: apiUrl,
        data: data,
        headers: headers
      })
        .catch((err) => {
          let errorData = ''
          // Grab extra error message if content type is JSON
          if (err.response && err.response.data && err.response.headers['content-type'].includes('json')) {
            errorData = JSON.stringify(err.response.data, null, 2)
          }
          // Handle errors here, rather than up at caller level
          router.push({
            name: 'error',
            replace: true,
            params: { message: `API_ERROR: ${apiUrl}\n${err.toString()}\n${errorData}` }
          })
        })
    },
  }
}
import Head from 'next/head'
import React, { useState } from 'react'
import { Form, Input, Select } from 'rfv'
import Link from 'next/link'
import { ConnectKitButton } from "connectkit"
import { saveImageToGallery } from '../lib/supabase'

const validations = {
  empty: [
    {
      rule: 'isLength',
      args: { min: 1 },
      invalidFeedback: 'Please provide a value'
    }
  ]
}

export default () => {
  const [imageData, setImageData] = useState()
  const [formIsSubmitting, setFormIsSubmitting] = useState(false)
  const [showAttributionModal, setShowAttributionModal] = useState(false)
  const [attribution, setAttribution] = useState('')
  const [saveError, setSaveError] = useState(null)

  const onSubmit = res => {
    if (res.isFormValid) {
      setImageData('')
      setFormIsSubmitting(true)
    }
  }

  const postSubmit = res => {
    setFormIsSubmitting(false)
    if (res.data?.data) {
      setImageData(res.data.data)
    }
  }

  const addToGallery = async () => {
    try {
      setSaveError(null)
      await saveImageToGallery({
        imageData: `data:image/png;base64,${imageData}`,
        attribution: attribution || 'Anonymous'
      })
      setShowAttributionModal(false)
      setAttribution('')
    } catch (error) {
      console.error('Failed to save to gallery:', error)
      setSaveError('Failed to save image to gallery. Please try again.')
    }
  }

  return (
    <div>
      <Head>
        <title>DUOLOGY</title>
      </Head>

      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000 }}>
        <ConnectKitButton />
      </div>

      <div className='gallery-link'>
        <Link href="/gallery">
          <button>
            <i className='icon icon-photo_library' /> View Gallery
          </button>
        </Link>
      </div>

      <div className="title-container">
        <h1>DUOLOGY</h1>
        <p className="subtitle">duo's eulogy</p>
      </div>

      <Form
        onSubmit={onSubmit}
        postSubmit={postSubmit}
        postOptions={{ method: 'post', url: '/api/get-image' }}
      >
        <fieldset disabled={formIsSubmitting}>
          <div className='narrowInputs one'>
            <div className='inputWrapper'>
              <label htmlFor='url'>Post URL</label>
              <div className='inputWithButton'>
                <Input
                  type='text'
                  id='url'
                  name='url'
                  validations={validations.empty}
                  placeholder='https://warpcast.com/~/cast/0x8b...'
                />

                <button type='submit' className='submitButton'>
                  <i className='icon icon-navigate_next' />
                </button>
              </div>
            </div>
          </div>

          <div className='narrowInputs two'>
            <div className='inputWrapper'>
              <label htmlFor='width'>Width</label>
              <Input
                id='width'
                type='text'
                name='width'
                value='1000'
                placeholder='1000'
                validations={validations.empty}
              />
            </div>

            <div className='inputWrapper'>
              <label htmlFor='padding'>Padding</label>
              <Input
                value='25'
                type='text'
                id='padding'
                name='padding'
                placeholder='50'
                validations={validations.empty}
              />
            </div>
          </div>

          <div className='narrowInputs three'>
            <div className='inputWrapper'>
              <label htmlFor='theme'>Theme</label>
              <Select id='theme' name='theme' value='light'>
                <option value='light'>Light</option>
                <option value='dark'>Dark</option>
              </Select>
            </div>

            <div className='inputWrapper'>
              <label htmlFor='hideCard'>Hide Card</label>
              <Select id='hideCard' name='hideCard' value='false'>
                <option value='true'>True</option>
                <option value='false'>False</option>
              </Select>
            </div>

            <div className='inputWrapper'>
              <label htmlFor='hideThread'>Hide Thread</label>
              <Select id='hideThread' name='hideThread' value='true'>
                <option value='true'>True</option>
                <option value='false'>False</option>
              </Select>
            </div>
          </div>

          <div className='generatedImageWrapper'>
            {
              imageData
                ? (
                  <div>
                    <img
                      className='generatedImage'
                      src={`data:image/png;base64,${imageData}`}
                    />

                    <button
                      type='button'
                      className='saveImageButton'
                      onClick={() => setShowAttributionModal(true)}
                    >
                      <i className='icon icon-add_photo_alternate' />
                    </button>
                  </div>
                  )
                : (
                  <div className='helpText'>
                    {
                      formIsSubmitting
                        ? (<div>Loading...</div>)
                        : (<div>Type the X URL above</div>)
                    }
                  </div>
                  )
            }
          </div>
        </fieldset>
      </Form>

      {showAttributionModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3>Add to Gallery</h3>
            {saveError && <div className="error-message">{saveError}</div>}
            <div className='modal-form'>
              <input
                type='text'
                placeholder='Your name (optional)'
                value={attribution}
                onChange={(e) => setAttribution(e.target.value)}
                className='attribution-input'
              />
              <div className='modal-buttons'>
                <button 
                  onClick={() => {
                    setShowAttributionModal(false)
                    setSaveError(null)
                  }} 
                  className='cancel-button'
                >
                  Cancel
                </button>
                <button onClick={addToGallery} className='confirm-button'>
                  Add to Gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='socials'>
        <a href='https://github.com/ozgrozer/duology' target='_blank' rel='noreferrer'>
          <i className='icon icon-github' />
        </a>

        <a href='https://x.com/ozgrozer' target='_blank' rel='noreferrer'>
          <i className='icon icon-x' />
        </a>

        <a href='https://warpcast.com/papa' target='_blank' rel='noreferrer'>
          <img src='/images/purple-white.svg' alt='Warpcast' className='warpcast-icon' />
        </a>
      </div>
    </div>
  )
}

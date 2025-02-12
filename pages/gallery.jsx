import Head from 'next/head'
import Link from 'next/link'
import React, { useState, useEffect, useRef } from 'react'
import { getGalleryImages, updateImageDimensions } from '../lib/supabase'

const GalleryPage = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    async function loadImages() {
      try {
        const data = await getGalleryImages()
        setImages(data || [])
      } catch (err) {
        console.error('Failed to load images:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadImages()
  }, [])

  // Function to handle image load and update dimensions
  const handleImageLoad = async (event, image) => {
    if (!image || !image.id) {
      console.error('Invalid image object:', image)
      return
    }

    const { naturalWidth, naturalHeight } = event.target
    const dimensions = { width: naturalWidth, height: naturalHeight }
    
    try {
      const updatedImage = await updateImageDimensions(image.id, dimensions)
      if (updatedImage) {
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === updatedImage.id ? updatedImage : img
          )
        )
      }
    } catch (err) {
      console.error('Failed to update image dimensions:', err)
    }
  }

  // Calculate layout dimensions
  const getItemStyle = (dimensions) => {
    // Set a fixed width that matches the tweet card width
    const fixedWidth = 600; // This should match the width of your tweet cards
    
    return {
      width: `${fixedWidth}px`,
      margin: '0 auto', // Center the items
      backgroundColor: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
      gridColumnEnd: 'span 2', // Make items take full width
    }
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <Link href="/">
          <button>Return to Generator</button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Head>
        <title>Tweet Gallery</title>
      </Head>

      <div className='gallery-header'>
        <Link href="/">
          <button className='back-button'>
            <i className='icon icon-arrow_back' /> Back to Generator
          </button>
        </Link>
        <h1>Tweet Gallery</h1>
      </div>

      {loading ? (
        <div className='loading'>Loading gallery...</div>
      ) : images.length === 0 ? (
        <div className='no-images'>
          <p>No tweets have been captured yet.</p>
          <Link href="/">
            <button>Generate Your First Tweet Image</button>
          </Link>
        </div>
      ) : (
        <div className='gallery-grid' ref={galleryRef} style={{
          display: 'grid',
          gap: '30px',
          padding: '20px',
          maxWidth: '1400px',
          margin: '0 auto',
          gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))'
        }}>
          {images.map((image) => (
            <div
              key={image.id}
              className='gallery-item'
              style={getItemStyle(image.dimensions)}
            >
              <img
                src={image.image_url}
                alt={`Tweet by ${image.attribution}`}
                onLoad={(e) => handleImageLoad(e, image)}
                style={{ width: '100%', display: 'block' }}
              />
              <div className='gallery-item-overlay'>
                <div className='gallery-item-info'>
                  <span className='attribution'>By {image.attribution}</span>
                  <span className='timestamp'>{new Date(image.timestamp).toLocaleDateString()}</span>
                  <button onClick={() => window.open(image.image_url, '_blank')}>
                    View Full Size
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GalleryPage; 
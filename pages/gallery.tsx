import Head from "next/head";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { ConnectKitButton } from "connectkit";
import { getGalleryImages, updateImageDimensions } from "@/lib/supabase";

// @ts-ignore
import Masonry from "masonry-layout";
// @ts-ignore
import imagesLoaded from "imagesloaded";

const GalleryPage: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const masonryRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLImageElement | null>(null);
  const originalRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    async function loadImages() {
      try {
        const data = await getGalleryImages();
        setImages(data || []);
      } catch (err: any) {
        console.error("Failed to load images:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadImages();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && images.length > 0 && gridRef.current) {
      // Dynamically import Masonry and imagesLoaded
      // Already imported above as any
      // @ts-ignore
      masonryRef.current = new Masonry(gridRef.current, {
        itemSelector: ".grid__item",
        columnWidth: 270,
        gutter: 20,
        fitWidth: true,
        transitionDuration: "0.3s",
      });

      // Wait for all images to load
      // @ts-ignore
      const imgLoad = imagesLoaded(gridRef.current);

      imgLoad.on("progress", (instance: any, image: any) => {
        handleImageLoad(image.img, image.img.dataset.imageId);
        masonryRef.current?.layout();
      });

      imgLoad.on("done", () => {
        gridRef.current?.classList.add("grid--loaded");
      });

      const debouncedLayout = debounce(() => {
        if (masonryRef.current) {
          masonryRef.current.layout();
        }
      }, 100);

      window.addEventListener("resize", debouncedLayout);
      return () => {
        window.removeEventListener("resize", debouncedLayout);
        if (masonryRef.current) {
          masonryRef.current.destroy();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const handleImageLoad = async (imgElement: HTMLImageElement, imageId: string) => {
    if (!imageId) return;

    const { naturalWidth, naturalHeight } = imgElement;
    const dimensions = { width: naturalWidth, height: naturalHeight };

    try {
      const updatedImage = await updateImageDimensions(imageId, dimensions);
      if (updatedImage) {
        setImages((prevImages) =>
          prevImages.map((img) => (img.id === updatedImage.id ? updatedImage : img))
        );
      }
    } catch (err) {
      console.error("Failed to update image dimensions:", err);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, image: any) => {
    e.preventDefault();
    const clickedItem = e.currentTarget;
    const itemRect = clickedItem.getBoundingClientRect();

    // Create and position clone
    const img = clickedItem.querySelector("img");
    if (!img) return;
    const clone = img.cloneNode(true) as HTMLImageElement;
    clone.className = "clone";
    clone.style.position = "fixed";
    clone.style.left = `${itemRect.left}px`;
    clone.style.top = `${itemRect.top}px`;
    clone.style.width = `${itemRect.width}px`;
    clone.style.height = `${itemRect.height}px`;
    document.body.appendChild(clone);
    cloneRef.current = clone;

    // Calculate final dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxWidth = viewportWidth * 0.8;
    const maxHeight = viewportHeight * 0.8;

    const defaultRatio = 16 / 9;
    const imgRatio =
      image.dimensions?.width && image.dimensions?.height
        ? image.dimensions.width / image.dimensions.height
        : defaultRatio;

    let finalWidth, finalHeight;

    if (imgRatio > maxWidth / maxHeight) {
      finalWidth = maxWidth;
      finalHeight = maxWidth / imgRatio;
    } else {
      finalHeight = maxHeight;
      finalWidth = maxHeight * imgRatio;
    }

    // Position clone for animation
    requestAnimationFrame(() => {
      clone.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
      clone.style.transform = `
        translate3d(${(viewportWidth - finalWidth) / 2 - itemRect.left}px,
                   ${(viewportHeight - finalHeight) / 2 - itemRect.top}px,
                   0)
        scale3d(${finalWidth / itemRect.width},
               ${finalHeight / itemRect.height},
               1)`;
    });

    // Show preview overlay
    setSelectedImage(image);
    setIsPreviewOpen(true);
    document.body.classList.add("preview-open");

    // Load high-res image
    const originalImg = new window.Image();
    originalImg.src = image.image_url;
    originalImg.className = "original";
    originalImg.style.opacity = "0";
    originalRef.current = originalImg;

    originalImg.onload = () => {
      if (previewRef.current) {
        const previewImageDiv = previewRef.current.querySelector(
          ".preview-image"
        );
        if (previewImageDiv) {
          previewImageDiv.appendChild(originalImg);
          requestAnimationFrame(() => {
            if (cloneRef.current) cloneRef.current.style.opacity = "0";
            originalImg.style.opacity = "1";
          });
        }
      }
    };
  };

  const closePreview = () => {
    if (!cloneRef.current || !selectedImage) return;

    const gridItem = document.querySelector(
      `[data-image-id="${selectedImage.id}"]`
    ) as HTMLElement;
    if (!gridItem) return;
    const itemRect = gridItem.getBoundingClientRect();

    // Animate clone back to original position
    cloneRef.current.style.transform = `
      translate3d(0, 0, 0)
      scale3d(1, 1, 1)`;
    cloneRef.current.style.opacity = "1";

    if (originalRef.current) {
      originalRef.current.style.opacity = "0";
    }

    // Clean up after animation
    const handleTransitionEnd = () => {
      if (cloneRef.current) {
        cloneRef.current.remove();
        cloneRef.current = null;
      }
      if (originalRef.current) {
        originalRef.current.remove();
        originalRef.current = null;
      }
      setIsPreviewOpen(false);
      setSelectedImage(null);
      document.body.classList.remove("preview-open");
    };

    cloneRef.current.addEventListener("transitionend", handleTransitionEnd, {
      once: true,
    });
  };

  // Utility function for debouncing
  function debounce(fn: (...args: any[]) => void, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
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
    );
  }

  return (
    <div className="container">
      <Head>
        <title>DUOLOGY - Gallery</title>
      </Head>

      <div className="header-buttons">
        <Link href="/">
          <button className="back-button">
            <i className="icon icon-arrow_back" /> Back to Generator
          </button>
        </Link>
        <div className="connect-wallet">
          <ConnectKitButton />
        </div>
      </div>

      <div className="title-container">
        <h1>DUOLOGY</h1>
        <p className="subtitle">duo's eulogy</p>
      </div>

      {loading ? (
        <div className="loading">Loading gallery...</div>
      ) : images.length === 0 ? (
        <div className="no-images">
          <p>No tweets have been captured yet.</p>
          <Link href="/">
            <button>Generate Your First Tweet Image</button>
          </Link>
        </div>
      ) : (
        <div className="content">
          <div className="grid" ref={gridRef}>
            {images.map((image) => (
              <div
                key={image.id}
                className="grid__item"
                data-image-id={image.id}
                onClick={(e) => handleImageClick(e, image)}
              >
                <figure>
                  <div className="img-wrap">
                    <img
                      src={image.image_url}
                      alt={`Tweet by ${image.attribution}`}
                      data-image-id={image.id}
                    />
                  </div>
                  <figcaption>
                    <h3>{image.attribution}</h3>
                    <p>{new Date(image.timestamp).toLocaleDateString()}</p>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>

          {isPreviewOpen && (
            <div
              className="preview preview--open"
              ref={previewRef}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closePreview();
                }
              }}
            >
              <button className="action action--close" onClick={closePreview}>
                <i className="icon icon-close"></i>
                <span className="text-hidden">Close</span>
              </button>
              <div className="preview-content">
                <div className="preview-image"></div>
                <div className="preview-details">
                  <div className="preview-header">
                    <h3>Tweet Details</h3>
                    <div className="preview-meta">
                      <p className="attribution">
                        Captured by {selectedImage.attribution}
                      </p>
                      <p className="timestamp">
                        Added on{" "}
                        {new Date(selectedImage.timestamp).toLocaleDateString()} at{" "}
                        {new Date(selectedImage.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="preview-stats">
                    <div className="stat">
                      <span className="stat-label">Dimensions</span>
                      <span className="stat-value">
                        {selectedImage.dimensions?.width} ×
                        {selectedImage.dimensions?.height}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Image Size</span>
                      <span className="stat-value">
                        {Math.round(
                          (selectedImage.dimensions?.width *
                            selectedImage.dimensions?.height) /
                            1000000 *
                            100
                        ) / 100}{" "}
                        MP
                      </span>
                    </div>
                  </div>
                  <a
                    href={selectedImage.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-button"
                  >
                    Download Original
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
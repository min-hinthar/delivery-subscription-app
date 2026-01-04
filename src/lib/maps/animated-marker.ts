/**
 * Animated marker that smoothly moves between positions
 *
 * Features:
 * - Smooth animation with ease-in-out easing
 * - Automatic rotation to face direction of travel
 * - Cancels previous animation when new position is set
 * - Proper cleanup to prevent memory leaks
 *
 * Usage:
 * ```ts
 * const marker = new AnimatedMarker(map, initialPosition);
 * await marker.animateTo(newPosition, 2000); // Animate over 2 seconds
 * marker.destroy(); // Clean up when done
 * ```
 */
export class AnimatedMarker {
  private marker: google.maps.Marker;
  private currentPosition: google.maps.LatLng;
  private targetPosition: google.maps.LatLng | null = null;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;
  private iconType: "symbol" | "icon";

  constructor(
    map: google.maps.Map,
    position: google.maps.LatLng,
    icon?: google.maps.Icon | google.maps.Symbol,
  ) {
    this.currentPosition = position;

    const defaultIcon: google.maps.Symbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 5,
      fillColor: "#D4A574",
      fillOpacity: 1,
      strokeColor: "#8B4513",
      strokeWeight: 2,
    };

    const markerIcon = icon || defaultIcon;
    this.iconType = this.isSymbol(markerIcon) ? "symbol" : "icon";

    this.marker = new google.maps.Marker({
      position,
      map,
      icon: markerIcon,
    });
  }

  /**
   * Type guard to check if icon is a Symbol
   */
  private isSymbol(icon: google.maps.Icon | google.maps.Symbol): icon is google.maps.Symbol {
    return "path" in icon;
  }

  /**
   * Animate marker to new position over duration
   *
   * @param newPosition - Target position to animate to
   * @param duration - Animation duration in milliseconds (default: 1000ms)
   * @returns Promise that resolves when animation completes
   *
   * Note: Calling this method while an animation is in progress will cancel
   * the previous animation and start a new one.
   */
  animateTo(newPosition: google.maps.LatLng, duration: number = 1000): Promise<void> {
    if (this.isDestroyed) {
      return Promise.reject(new Error("Cannot animate destroyed marker"));
    }

    if (duration < 0) {
      return Promise.reject(new Error("Animation duration must be positive"));
    }

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing animation
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }

        this.targetPosition = newPosition;
        const startTime = Date.now();
        const startLat = this.currentPosition.lat();
        const startLng = this.currentPosition.lng();
        const endLat = newPosition.lat();
        const endLng = newPosition.lng();

        // Check if geometry library is loaded
        if (!google.maps.geometry || !google.maps.geometry.spherical) {
          throw new Error(
            "Google Maps Geometry library is not loaded. Add 'geometry' to the libraries parameter."
          );
        }

        // Calculate heading (rotation angle)
        const heading = google.maps.geometry.spherical.computeHeading(
          this.currentPosition,
          newPosition,
        );

        const animate = () => {
          if (this.isDestroyed) {
            resolve();
            return;
          }

          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function (ease-in-out cubic)
          const eased =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const lat = startLat + (endLat - startLat) * eased;
          const lng = startLng + (endLng - startLng) * eased;

          this.currentPosition = new google.maps.LatLng(lat, lng);
          this.marker.setPosition(this.currentPosition);

          // Rotate marker to face direction of travel (only for Symbol icons)
          if (this.iconType === "symbol") {
            const icon = this.marker.getIcon() as google.maps.Symbol;
            if (icon && typeof icon === "object") {
              icon.rotation = heading;
              this.marker.setIcon(icon);
            }
          }

          if (progress < 1) {
            this.animationFrameId = requestAnimationFrame(animate);
          } else {
            this.animationFrameId = null;
            resolve();
          }
        };

        animate();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get current position of the marker
   */
  getPosition(): google.maps.LatLng {
    return this.currentPosition;
  }

  /**
   * Show or hide the marker on the map
   */
  setMap(map: google.maps.Map | null): void {
    this.marker.setMap(map);
  }

  /**
   * Check if the marker is currently animating
   */
  isAnimating(): boolean {
    return this.animationFrameId !== null;
  }

  /**
   * Clean up the marker and stop any ongoing animations
   * Call this when you no longer need the marker to prevent memory leaks
   */
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.marker.setMap(null);
    this.isDestroyed = true;
  }
}

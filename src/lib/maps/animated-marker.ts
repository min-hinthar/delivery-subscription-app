/**
 * Animated marker that smoothly moves between positions
 */
export class AnimatedMarker {
  private marker: google.maps.Marker;
  private currentPosition: google.maps.LatLng;
  private targetPosition: google.maps.LatLng | null = null;
  private animationFrameId: number | null = null;

  constructor(
    map: google.maps.Map,
    position: google.maps.LatLng,
    icon?: google.maps.Icon | google.maps.Symbol,
  ) {
    this.currentPosition = position;
    this.marker = new google.maps.Marker({
      position,
      map,
      icon:
        icon ||
        {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: "#D4A574",
          fillOpacity: 1,
          strokeColor: "#8B4513",
          strokeWeight: 2,
        },
    });
  }

  /**
   * Animate marker to new position over duration
   */
  animateTo(newPosition: google.maps.LatLng, duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      this.targetPosition = newPosition;
      const startTime = Date.now();
      const startLat = this.currentPosition.lat();
      const startLng = this.currentPosition.lng();
      const endLat = newPosition.lat();
      const endLng = newPosition.lng();

      // Calculate heading (rotation angle)
      const heading = google.maps.geometry.spherical.computeHeading(
        this.currentPosition,
        newPosition,
      );

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-in-out)
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const lat = startLat + (endLat - startLat) * eased;
        const lng = startLng + (endLng - startLng) * eased;

        this.currentPosition = new google.maps.LatLng(lat, lng);
        this.marker.setPosition(this.currentPosition);

        // Rotate marker to face direction of travel
        const icon = this.marker.getIcon() as google.maps.Symbol;
        if (icon) {
          icon.rotation = heading;
          this.marker.setIcon(icon);
        }

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.animationFrameId = null;
          resolve();
        }
      };

      animate();
    });
  }

  getPosition(): google.maps.LatLng {
    return this.currentPosition;
  }

  setMap(map: google.maps.Map | null): void {
    this.marker.setMap(map);
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.marker.setMap(null);
  }
}

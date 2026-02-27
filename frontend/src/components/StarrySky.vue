<template>
  <div class="starry-sky">
    <div class="stars-container">
      <div 
        v-for="star in stars" 
        :key="star.id"
        class="star"
        :class="star.size"
        :style="{
          left: star.left + '%',
          top: star.top + '%',
          animationDelay: star.delay + 's',
          animationDuration: star.duration + 's'
        }"
      ></div>
    </div>
    <div class="shooting-stars">
      <div class="shooting-star"></div>
      <div class="shooting-star"></div>
      <div class="shooting-star"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const stars = ref([])

const generateStars = () => {
  const starList = []
  let id = 0
  
  for (let i = 0; i < 40; i++) {
    const sizeRand = Math.random()
    let size = 'small'
    if (sizeRand > 0.85) size = 'large'
    else if (sizeRand > 0.6) size = 'medium'
    
    starList.push({
      id: id++,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 4
    })
  }
  
  stars.value = starList
}

onMounted(() => {
  generateStars()
})
</script>

<style scoped>
.starry-sky {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  will-change: transform;
}

.stars-container {
  position: absolute;
  width: 100%;
  height: 100%;
}

.star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  animation: twinkle ease-in-out infinite;
  will-change: opacity, transform;
}

.star.small {
  width: 1px;
  height: 1px;
  box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.3);
}

.star.medium {
  width: 1.5px;
  height: 1.5px;
  box-shadow: 0 0 3px 1px rgba(255, 255, 255, 0.4);
}

.star.large {
  width: 2px;
  height: 2px;
  box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.5);
}

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.8);
  }
}

.shooting-stars {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shooting-star {
  position: absolute;
  width: 100px;
  height: 1px;
  background: linear-gradient(90deg, #fff, transparent);
  opacity: 0;
  animation: shooting 8s ease-in-out infinite;
  will-change: opacity, transform;
}

.shooting-star:nth-child(1) {
  top: 10%;
  right: 15%;
  animation-delay: 0s;
}

.shooting-star:nth-child(2) {
  top: 25%;
  right: 35%;
  animation-delay: 3s;
}

.shooting-star:nth-child(3) {
  top: 5%;
  right: 50%;
  animation-delay: 6s;
}

@keyframes shooting {
  0% {
    opacity: 0;
    transform: translateX(0) translateY(0) rotate(-45deg);
  }
  2% {
    opacity: 1;
  }
  10% {
    opacity: 0;
    transform: translateX(-350px) translateY(350px) rotate(-45deg);
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .star {
    animation: none;
    opacity: 0.8;
  }
  .shooting-star {
    animation: none;
  }
}
</style>

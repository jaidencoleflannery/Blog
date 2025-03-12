// Shortcuts for query selectors
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

/**
 * SmoothScroll
 * Enables smooth scrolling for anchor links with href="#..."
 * (Even if your current HTML has no anchors, leaving this in
 * won't hurt—just ensures future anchors will scroll smoothly.)
 */
class SmoothScroll {
    constructor() {
        this.links = $$('a[href^="#"]');
        this.init();
    }

    init() {
        this.links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const target = $(link.getAttribute('href'));
                if (target) {
                    this.scrollToTarget(target);
                }
            });
        });
    }

    scrollToTarget(target) {
        const start = window.pageYOffset;
        const targetPosition = target.getBoundingClientRect().top + start;
        const distance = targetPosition - start;
        const duration = 1000;
        let startTime = null;

        const animation = currentTime => {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;
            // A simple ease-out function
            const easing = p => 1 - Math.pow(1 - p, 4);
            
            if (progress < 1) {
                window.scrollTo(0, start + distance * easing(progress));
                requestAnimationFrame(animation);
            } else {
                window.scrollTo(0, targetPosition);
            }
        };

        requestAnimationFrame(animation);
    }
}

/**
 * TextColorizer
 * Splits text nodes into individual letters wrapped in spans.
 * On hover, letters temporarily change to random neon green-like colors.
 */
class TextColorizer {
    constructor() {
        this.colors = [
            '#7cff00','#84ff00','#8cff00','#94ff00','#9cff00',
            '#a4ff00','#acff00','#b4ff00','#bcff00'
        ];
        // Elements to skip coloring
        this.excludeSelectors = [
            '.nav-link','button','input','textarea','.read-more',
            '.noise','code','script','style','.post-category','.loader'
        ];
        this.init();
    }

    init() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: node => {
                    // Skip empty text nodes
                    if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                    // Skip if inside excluded elements
                    if (this.shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        textNodes.forEach(node => this.wrapTextNode(node));
    }

    shouldSkipNode(node) {
        const parent = node.parentElement;
        if (!parent) return true;
        return this.excludeSelectors.some(selector =>
            parent.matches(selector) || parent.closest(selector)
        );
    }

    wrapTextNode(node) {
        if (!node.parentElement) return;
        
        const wrapper = document.createElement('span');
        wrapper.className = 'text-wrapper';
        node.parentElement.insertBefore(wrapper, node);

        // Turn each character into a separate span
        [...node.textContent].forEach(char => {
            if (char === ' ') {
                wrapper.appendChild(document.createTextNode(' '));
            } else {
                const span = document.createElement('span');
                span.className = 'hover-letter';
                span.textContent = char;
                this.attachHoverEvents(span);
                wrapper.appendChild(span);
            }
        });

        node.remove();
    }

    attachHoverEvents(element) {
        let originalColor = null;
        let timeoutId = null;

        element.addEventListener('mouseover', () => {
            if (!originalColor) {
                originalColor = window.getComputedStyle(element).color;
            }
            clearTimeout(timeoutId);
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            element.style.color = color;
            element.style.transform = 'translateY(-1px)';
        });

        element.addEventListener('mouseout', () => {
            element.style.transform = '';
            timeoutId = setTimeout(() => {
                element.style.color = originalColor;
            }, 150);
        });
    }
}

/**
 * TextAnimation
 * Adds a subtle 3D-like rotate/zoom effect to each letter on hover.
 */
class TextAnimation {
    static get properties() {
        return {
            perspective: 250,
            duration: 800,
            easing: 'cubic-bezier(0.19, 1, 0.22, 1)'
        };
    }

    static createKeyframes(intensity = 1) {
        return {
            transform: [
                'translateZ(0) rotateX(0) rotateY(0)',
                `translateZ(${20 * intensity}px) rotateX(${-20 * intensity}deg) rotateY(${10 * intensity}deg)`,
                'translateZ(0) rotateX(0) rotateY(0)'
            ],
            opacity: ['1', '0.7', '1']
        };
    }

    static setupAnimation() {
        document.querySelectorAll('.hover-letter').forEach(letter => {
            letter.addEventListener('mouseenter', () => {
                const animation = letter.animate(
                    TextAnimation.createKeyframes(),
                    {
                        duration: TextAnimation.properties.duration,
                        easing: TextAnimation.properties.easing,
                        fill: 'forwards'
                    }
                );
                // Reset transform after animation
                animation.onfinish = () => {
                    letter.style.transform = '';
                };
            });
        });
    }
}

class Loader {
    constructor() {
        this.element = $('.loader-block');
        this.container = $('.loader');
        this.init();
    }

    init() {
            let visible = true;
            this.intervalId = setInterval(() => {
                visible = !visible;
                this.element.style.display = visible ? 'flex' : 'none';
            }, 800);

            setTimeout(() => {
                this.element.remove();
                this.container.remove();
            }, 3000);
    }

}

class TextTypingAnimation {
    /**
     * @param {number} typingSpeed - Milliseconds between typing each character.
     * @param {number} initialDelay - Milliseconds to wait before typing the first element.
     */
    constructor(typingSpeed = 140, initialDelay = 3000) {
      this.typingSpeed = typingSpeed;
      this.initialDelay = initialDelay;
      this.init();
    }
  
    init() {
      const elements = document.querySelectorAll('.text-load');
  
      // Hide all .text-load elements initially
      elements.forEach(el => {
        el.style.visibility = 'hidden'; 
      });
  
      let currentElemIndex = 0;
  
      // Function to type the current element's text, then move to the next
      const typeNextElement = () => {
        if (currentElemIndex >= elements.length) return;
  
        const elem = elements[currentElemIndex];
        const fullText = elem.textContent;
        
        // Clear and show this element so we can type into it
        elem.style.visibility = 'visible';
        elem.textContent = '';
  
        let charIndex = 0;
        const typeChar = () => {
          if (charIndex < fullText.length) {
            elem.textContent += fullText.charAt(charIndex);
            charIndex++;
            setTimeout(typeChar, this.typingSpeed);
          } else {
            // Move on to the next element
            currentElemIndex++;
            typeNextElement();
          }
        };
        
        typeChar();
      };
  
      // Start typing after the initial delay
      setTimeout(typeNextElement, this.initialDelay);
    }
  }
  
  // Example usage:
  // const typer = new TextTypingAnimation(100, 5000);
  // typer.init();
  

  new SmoothScroll();
  new TextColorizer();
  TextAnimation.setupAnimation();

// When DOM is fully loaded, initialize colorizing and letter-hover animations
document.addEventListener('DOMContentLoaded', () => {
    new Loader();
    new TextTypingAnimation();
});

// Initialize smooth scrolling (does nothing unless you have <a href="#..."> links)


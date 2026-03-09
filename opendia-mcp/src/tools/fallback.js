/**
 * 回退工具
 * 浏览器扩展未连接时的默认工具定义
 */

/**
 * 获取回退工具定义
 * @returns {Array}
 */
function getFallbackTools() {
  return [
    {
      name: "page_analyze",
      description:
        "🔍 BACKGROUND TAB READY: Analyze any tab without switching! Two-phase intelligent page analysis with token efficiency optimization. Use tab_id parameter to analyze background tabs while staying on current page. (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          intent_hint: {
            type: "string",
            description:
              "What user wants to do: post_tweet, search, login, etc.",
          },
          phase: {
            type: "string",
            enum: ["discover", "detailed"],
            default: "discover",
            description:
              "Analysis phase: 'discover' for quick scan, 'detailed' for full analysis",
          },
        },
        required: ["intent_hint"],
      },
    },
    {
      name: "page_extract_content",
      description:
        "📄 BACKGROUND TAB READY: Extract content from any tab without switching! Perfect for analyzing multiple research tabs, articles, or pages simultaneously. Use tab_id to target specific background tabs. (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          content_type: {
            type: "string",
            enum: ["article", "search_results", "posts"],
            description: "Type of content to extract",
          },
          summarize: {
            type: "boolean",
            default: true,
            description:
              "Return summary instead of full content (saves tokens)",
          },
        },
        required: ["content_type"],
      },
    },
    {
      name: "element_click",
      description:
        "🖱️ BACKGROUND TAB READY: Click elements in any tab without switching! Perform actions on background tabs while staying on current page. Use tab_id to target specific tabs. (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          element_id: {
            type: "string",
            description: "Element ID from page_analyze",
          },
          click_type: {
            type: "string",
            enum: ["left", "right", "double"],
            default: "left",
          },
        },
        required: ["element_id"],
      },
    },
    {
      name: "element_fill",
      description:
        "✏️ BACKGROUND TAB READY: Fill forms in any tab without switching! Enhanced focus and event simulation for modern web apps with anti-detection bypass for Twitter/X, LinkedIn, Facebook. Use tab_id to fill forms in background tabs. (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          element_id: {
            type: "string",
            description: "Element ID from page_analyze",
          },
          value: {
            type: "string",
            description: "Text to input",
          },
          clear_first: {
            type: "boolean",
            default: true,
            description: "Clear existing content before filling",
          },
        },
        required: ["element_id", "value"],
      },
    },
    {
      name: "page_navigate",
      description:
        "🧭 Navigate to URLs with wait conditions (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to navigate to" },
          wait_for: {
            type: "string",
            description: "CSS selector to wait for after navigation",
          },
        },
        required: ["url"],
      },
    },
    {
      name: "page_wait_for",
      description: "⏳ Wait for elements or conditions (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          condition_type: {
            type: "string",
            enum: ["element_visible", "text_present"],
            description: "Type of condition to wait for",
          },
          selector: {
            type: "string",
            description: "CSS selector (for element_visible condition)",
          },
          text: {
            type: "string",
            description: "Text to wait for (for text_present condition)",
          },
        },
        required: ["condition_type"],
      },
    },
    // 标签页管理工具
    {
      name: "tab_create",
      description: "Creates tabs. CRITICAL: For multiple identical tabs, ALWAYS use 'count' parameter! Examples: {url: 'https://x.com', count: 5} creates 5 Twitter tabs. {url: 'https://github.com', count: 10} creates 10 GitHub tabs. Single tab: {url: 'https://example.com'}. Multiple different URLs: {urls: ['url1', 'url2']}.",
      inputSchema: {
        type: "object",
        examples: [
          { url: "https://x.com", count: 5 },
          { url: "https://github.com", count: 10 },
          { urls: ["https://x.com/post1", "https://x.com/post2", "https://google.com"] },
          { url: "https://example.com" }
        ],
        properties: {
          url: {
            type: "string",
            description: "Single URL to open. Can be used with 'count' to create multiple identical tabs"
          },
          urls: {
            type: "array",
            items: { type: "string" },
            description: "PREFERRED FOR MULTIPLE URLS: Array of URLs to open ALL AT ONCE in a single batch operation. Pass ALL URLs here instead of making multiple calls! Example: ['https://x.com/post1', 'https://x.com/post2', 'https://google.com']",
            maxItems: 100
          },
          count: {
            type: "number",
            default: 1,
            minimum: 1,
            maximum: 50,
            description: "REQUIRED FOR MULTIPLE IDENTICAL TABS: Set this to N to create N copies of the same URL. For '5 Twitter tabs' use count=5 with url='https://x.com'. DO NOT make 5 separate calls!"
          },
          active: {
            type: "boolean",
            default: true,
            description: "Whether to activate the last created tab (single tab only)"
          },
          wait_for: {
            type: "string",
            description: "CSS selector to wait for after tab creation (single tab only)"
          },
          timeout: {
            type: "number",
            default: 10000,
            description: "Maximum wait time per tab in milliseconds"
          },
          batch_settings: {
            type: "object",
            description: "Performance control settings for batch operations",
            properties: {
              chunk_size: {
                type: "number",
                default: 5,
                minimum: 1,
                maximum: 10,
                description: "Number of tabs to create per batch"
              },
              delay_between_chunks: {
                type: "number",
                default: 1000,
                minimum: 100,
                maximum: 5000,
                description: "Delay between batches in milliseconds"
              },
              delay_between_tabs: {
                type: "number",
                default: 200,
                minimum: 50,
                maximum: 1000,
                description: "Delay between individual tabs in milliseconds"
              }
            }
          }
        }
      }
    },
    {
      name: "tab_close",
      description: "❌ Close specific tab(s) by ID or close current tab (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          tab_id: {
            type: "number",
            description: "Specific tab ID to close (optional, closes current tab if not provided)"
          },
          tab_ids: {
            type: "array",
            items: { type: "number" },
            description: "Array of tab IDs to close multiple tabs"
          }
        }
      }
    },
    {
      name: "tab_list",
      description: "📋 TAB DISCOVERY: Get list of all open tabs with IDs for background tab targeting! Shows content script readiness status and tab details. Essential for multi-tab workflows - use tab IDs with other tools to work on background tabs. (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          current_window_only: {
            type: "boolean",
            default: true,
            description: "Only return tabs from the current window"
          },
          include_details: {
            type: "boolean",
            default: true,
            description: "Include additional tab details (title, favicon, etc.)"
          }
        }
      }
    },
    {
      name: "tab_switch",
      description: "🔄 Switch to a specific tab by ID (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          tab_id: {
            type: "number",
            description: "Tab ID to switch to"
          }
        },
        required: ["tab_id"]
      }
    },
    // 元素状态工具
    {
      name: "element_get_state",
      description: "🔍 Get detailed state information for a specific element (disabled, clickable, etc.) (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          element_id: {
            type: "string",
            description: "Element ID from page_analyze"
          }
        },
        required: ["element_id"]
      }
    },
    // 工作区和引用管理工具
    {
      name: "get_bookmarks",
      description: "Get all bookmarks or search for specific bookmarks (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for bookmarks (optional)"
          }
        }
      }
    },
    {
      name: "add_bookmark",
      description: "Add a new bookmark (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title of the bookmark"
          },
          url: {
            type: "string",
            description: "URL of the bookmark"
          },
          parentId: {
            type: "string",
            description: "ID of the parent folder (optional)"
          }
        },
        required: ["title", "url"]
      }
    },
    {
      name: "get_history",
      description: "🕒 Search browser history with comprehensive filters for finding previous work (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          keywords: {
            type: "string",
            description: "Search keywords to match in page titles and URLs"
          },
          start_date: {
            type: "string",
            format: "date-time",
            description: "Start date for history search (ISO 8601 format)"
          },
          end_date: {
            type: "string",
            format: "date-time",
            description: "End date for history search (ISO 8601 format)"
          },
          domains: {
            type: "array",
            items: { type: "string" },
            description: "Filter by specific domains"
          },
          min_visit_count: {
            type: "number",
            default: 1,
            description: "Minimum visit count threshold"
          },
          max_results: {
            type: "number",
            default: 50,
            maximum: 500,
            description: "Maximum number of results to return"
          },
          sort_by: {
            type: "string",
            enum: ["visit_time", "visit_count", "title"],
            default: "visit_time",
            description: "Sort results by visit time, visit count, or title"
          },
          sort_order: {
            type: "string",
            enum: ["desc", "asc"],
            default: "desc",
            description: "Sort order"
          }
        }
      }
    },
    {
      name: "get_selected_text",
      description: "📝 BACKGROUND TAB READY: Get selected text from any tab without switching! Perfect for collecting quotes, citations, or highlighted content from multiple research tabs simultaneously. (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          include_metadata: {
            type: "boolean",
            default: true,
            description: "Include metadata about the selection (element info, position, etc.)"
          },
          max_length: {
            type: "number",
            default: 10000,
            description: "Maximum length of text to return"
          }
        }
      }
    },
    {
      name: "page_scroll",
      description: "📜 BACKGROUND TAB READY: Scroll any tab without switching! Critical for long pages. Navigate through content in background tabs while staying on current page. Use tab_id to target specific tabs. (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          direction: {
            type: "string",
            enum: ["up", "down", "left", "right", "top", "bottom"],
            default: "down",
            description: "Direction to scroll"
          },
          amount: {
            type: "string",
            enum: ["small", "medium", "large", "page", "custom"],
            default: "medium",
            description: "Amount to scroll"
          },
          pixels: {
            type: "number",
            description: "Custom pixel amount (when amount is 'custom')"
          },
          smooth: {
            type: "boolean",
            default: true,
            description: "Use smooth scrolling animation"
          },
          element_id: {
            type: "string",
            description: "Scroll to specific element (overrides direction/amount)"
          },
          wait_after: {
            type: "number",
            default: 500,
            description: "Milliseconds to wait after scrolling"
          }
        }
      }
    },
    {
      name: "get_page_links",
      description: "🔗 Get all hyperlinks on the current page with smart filtering (Extension required)",
      inputSchema: {
        type: "object",
        properties: {
          include_internal: {
            type: "boolean",
            default: true,
            description: "Include internal links (same domain)"
          },
          include_external: {
            type: "boolean",
            default: true,
            description: "Include external links (different domains)"
          },
          domain_filter: {
            type: "string",
            description: "Filter links to include only specific domain(s)"
          },
          max_results: {
            type: "number",
            default: 100,
            maximum: 500,
            description: "Maximum number of links to return"
          }
        }
      }
    },
    {
      name: "page_style",
      description: "🎨 Transform page appearance with themes, colors, fonts, and fun effects! Apply preset themes like 'dark_hacker', 'retro_80s', or create custom styles. Perfect for making boring pages fun or improving readability.",
      inputSchema: {
        type: "object",
        examples: [
          { mode: "preset", theme: "dark_hacker" },
          { mode: "custom", background: "#000", text_color: "#00ff00", font: "monospace" },
          { mode: "ai_mood", mood: "cozy coffee shop vibes", intensity: "strong" },
          { mode: "effect", effect: "matrix_rain", duration: 30 }
        ],
        properties: {
          mode: {
            type: "string",
            enum: ["preset", "custom", "ai_mood", "effect", "reset"],
            description: "Styling mode to use"
          },
          theme: {
            type: "string",
            enum: ["dark_hacker", "retro_80s", "rainbow_party", "minimalist_zen", "high_contrast", "cyberpunk", "pastel_dream", "newspaper"],
            description: "Preset theme name (when mode=preset)"
          },
          background: {
            type: "string",
            description: "Background color/gradient"
          },
          text_color: {
            type: "string",
            description: "Text color"
          },
          font: {
            type: "string",
            description: "Font family"
          },
          font_size: {
            type: "string",
            description: "Font size (e.g., '1.2em', '16px')"
          },
          mood: {
            type: "string",
            description: "Describe desired mood/feeling (when mode=ai_mood)"
          },
          intensity: {
            type: "string",
            enum: ["subtle", "medium", "strong"],
            default: "medium"
          },
          effect: {
            type: "string",
            enum: ["matrix_rain", "floating_particles", "cursor_trail", "neon_glow", "typing_effect"]
          },
          duration: {
            type: "number",
            description: "Effect duration in seconds",
            default: 10
          },
          remember: {
            type: "boolean",
            description: "Remember this style for this website",
            default: false
          }
        },
        required: ["mode"]
      }
    },
  ];
}

module.exports = {
  getFallbackTools
};

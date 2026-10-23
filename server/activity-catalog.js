import advanced from '../src/modules/home/home-galleries/advanced.json' with { type: 'json' }
import authors from '../src/modules/home/home-galleries/authors.json' with { type: 'json' }
import beginners from '../src/modules/home/home-galleries/beginners.json' with { type: 'json' }
import coaches from '../src/modules/home/home-galleries/coaches.json' with { type: 'json' }
import news from '../src/modules/home/home-news.json' with { type: 'json' }

const urls = [beginners, advanced, coaches, authors].flatMap((gallery) => {
  const watches = gallery.watches?.length ? gallery.watches : gallery.watch ? [gallery.watch] : []
  return [...(gallery.cards ?? []), ...watches.flatMap((watch) => watch.links ?? [])]
    .map((link) => link.websiteUrl)
})
urls.push(...[...news.redList, ...news.blackList, ...news.gossip].map((item) => item.sourceUrl))

export const activityUrls = [...new Set(urls.filter((url) => {
  if (!url) return false
  const parsed = new URL(url)
  return parsed.protocol === 'https:' || parsed.protocol === 'http:'
}))]

// Binance API (primary) with CoinGecko fallback
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3'
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

// Helper to get coin image ID (comprehensive map) - declared early for use in other functions
const getCoinImageId = (symbol) => {
  const imageMap = {
    'BTC': '1',
    'ETH': '279',
    'BNB': '825',
    'SOL': '4128',
    'ADA': '975',
    'XRP': '52',
    'DOGE': '5',
    'DOT': '12171',
    'MATIC': '4713',
    'LINK': '877',
    'AVAX': '12559',
    'UNI': '12504',
    'ATOM': '1481',
    'LTC': '2',
    'ETC': '1321',
    'XLM': '512',
    'ALGO': '4030',
    'VET': '3077',
    'ICP': '14495',
    'FIL': '2280',
    'TRX': '1958',
    'EOS': '1765',
    'AAVE': '7278',
    'MKR': '1518',
    'GRT': '6719',
    'SAND': '12129',
    'MANA': '11639',
    'AXS': '11645',
    'THETA': '2416',
    'ENJ': '2130',
    'CHZ': '4066',
    'HBAR': '4642',
    'NEAR': '11165',
    'FTM': '3513',
    'EGLD': '6892',
    'FLOW': '4558',
    'XTZ': '2010',
    'QNT': '3155',
    'ZEC': '1437',
    'DASH': '660',
    'BCH': '1831',
    'BSV': '3602',
    'ZIL': '2469',
    'IOTA': '1720',
    'NEO': '1376',
    'ONT': '2566',
    'WAVES': '3507',
    'OMG': '1808',
    'SNX': '2586',
    'CRV': '5414',
    'COMP': '5692',
    'YFI': '5864',
    'SUSHI': '6758',
    '1INCH': '8104',
    'BAL': '5728',
    'REN': '3139',
    'KNC': '1982',
    'ZRX': '1896',
    'BAT': '1697',
    'STORJ': '1904',
    'SKL': '5695',
    'COTI': '4705',
    'CHR': '3978',
    'KAVA': '3853',
    'BAND': '4269',
    'RLC': '1637',
    'OCEAN': '3911',
    'BEL': '6928',
    'CTK': '7174',
    'ALPHA': '7232',
    'LRC': '1934',
    'QTUM': '1684',
    'IOST': '2403',
    'CELR': '3814',
    'ONE': '3945',
    'HOT': '2729',
    'MTL': '1788',
    'OGN': '6719',
    'NKN': '2780',
    'DENT': '1836',
    'KEY': '2319',
    'STPT': '3718',
    'ANKR': '3783',
    'REEF': '6951',
    'DODO': '7224',
    'CAKE': '7192',
    'BAKE': '7064',
    'AUTO': '7186',
    'TKO': '7507',
    'ALPACA': '8239',
    'PERP': '7426',
    'LIT': '7368',
    'SFP': '7204',
    'DEGO': '7238',
    'CELO': '5567',
    'KLAY': '6841',
    'AR': '5619',
    'CTSI': '5444',
    'LINA': '7102',
    'PERL': '3893',
    'RIF': '3957',
    'CFX': '3954',
    'EPS': '5895',
    'AUDIO': '7455',
    'LAZIO': '8705',
    'PORTO': '8706',
    'CITY': '8707',
    'BAR': '5226',
    'FORTH': '8242',
    'CTXC': '2942',
    'XEC': '10791',
    'C98': '10974',
    'ENS': '13896',
    'GALA': '7083',
    'ILV': '8719',
    'YGG': '7859',
    'SYS': '541',
    'DF': '5564',
    'FIDA': '5899',
    'FRONT': '5893',
    'CVP': '5716',
    'AGLD': '8383',
    'RAD': '6843',
    'BETA': '6715',
    'RARE': '7857',
    'ADX': '1768',
    'AUCTION': '5906',
    'DAR': '8356',
    'BNX': '8738',
    'RGT': '7486',
    'MOVR': '9285',
    'KP3R': '5737',
    'QI': '8536',
    'POWR': '2132',
    'VGX': '1779',
    'JASMY': '8425',
    'AMP': '6945',
    'PLA': '7463',
    'PYTH': '22861',
    'PAXG': '4705',
    'PENDLE': '9481',
    'HOOK': '22188',
    'MAGIC': '12419',
    'HIFI': '5848',
    'ID': '23121',
    'ARB': '19441',
    'EDU': '24502',
    'SUI': '20947',
    '1000SATS': '29495',
    '1000PEPE': '29814',
    '1000FLOKI': '28616',
    'ACE': '23121',
    'NFP': '23121',
    'AI': '23121',
    'XAI': '23121',
    'MANTA': '23121',
    'ALT': '23121',
    'JTO': '23121',
    '1000BONK': '23121'
  }
  return imageMap[symbol] || '1'
}

// Helper to get coin names
const getCoinName = (symbol) => {
  const names = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'Binance Coin',
    'SOL': 'Solana',
    'ADA': 'Cardano',
    'XRP': 'Ripple',
    'DOGE': 'Dogecoin',
    'DOT': 'Polkadot',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink'
  }
  return names[symbol] || symbol
}

// Get 24h ticker from Binance
const getBinanceTicker = async (symbol) => {
  try {
    const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`)
    if (!response.ok) throw new Error('Binance API failed')
    return await response.json()
  } catch (error) {
    return null
  }
}

// Get multiple tickers from Binance
const getBinanceTickers = async (symbols) => {
  try {
    const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`)
    if (!response.ok) throw new Error('Binance API failed')
    const allTickers = await response.json()
    
    // Filter for our symbols
    return allTickers.filter(ticker => 
      symbols.some(sym => ticker.symbol === sym)
    )
  } catch (error) {
    return []
  }
}

// CoinGecko fallback
const getCoinGeckoPrices = async (category = 'hot') => {
  try {
    let url = ''
    
    switch (category) {
      case 'hot':
        // Use markets endpoint sorted by volume for "hot" to get more coins
        url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1&sparkline=false`
        break
      
      case 'gainers':
        url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=250&page=1&sparkline=false`
        break
      
      case 'losers':
        url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=price_change_percentage_24h_asc&per_page=250&page=1&sparkline=false`
        break
      
      case 'new':
        url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`
        break
      
      case 'alpha':
        url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1&sparkline=false`
        break
      
      default:
        url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`
    }

    if (url) {
      const response = await fetch(url)
      const data = await response.json()
      
      return data.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price || 0,
        change24h: coin.price_change_percentage_24h || 0,
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
        volume: coin.total_volume || 0,
        image: coin.image
      }))
    }
  } catch (error) {
    console.error('CoinGecko error:', error)
    return []
  }
}

// Binance symbol mapping
const BINANCE_SYMBOLS = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'BNB': 'BNBUSDT',
  'SOL': 'SOLUSDT',
  'ADA': 'ADAUSDT',
  'XRP': 'XRPUSDT',
  'DOGE': 'DOGEUSDT',
  'DOT': 'DOTUSDT',
  'MATIC': 'MATICUSDT',
  'LINK': 'LINKUSDT'
}

export const getCryptoPrices = async (category = 'hot') => {
  try {
    // Try Binance first
    if (category === 'favourites') {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT']
      const tickers = await getBinanceTickers(symbols)
      
      if (tickers && tickers.length > 0) {
        return tickers.map(ticker => {
          const symbol = ticker.symbol.replace('USDT', '')
          return {
            id: symbol.toLowerCase(),
            name: getCoinName(symbol),
            symbol: symbol,
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            volume: parseFloat(ticker.quoteVolume),
            image: `https://assets.coingecko.com/coins/images/${getCoinImageId(symbol)}/small/${symbol.toLowerCase()}.png`
          }
        })
      }
    } else if (category === 'hot') {
      // Get top volume coins from Binance
      try {
        const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`)
        if (response.ok) {
          const allTickers = await response.json()
          // Filter USDT pairs and sort by volume
          const usdtPairs = allTickers
            .filter(t => t.symbol.endsWith('USDT'))
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
            .slice(0, 250)
          
          return usdtPairs.map(ticker => {
            const symbol = ticker.symbol.replace('USDT', '')
            const imageId = getCoinImageId(symbol)
            // Use CoinGecko image URL format: /coins/images/{id}/small/{name}.png
            // For some coins, we need to use the coin name instead of symbol
            const coinNameMap = {
              'BTC': 'bitcoin',
              'ETH': 'ethereum',
              'BNB': 'binancecoin',
              'SOL': 'solana',
              'ADA': 'cardano',
              'XRP': 'ripple',
              'DOGE': 'dogecoin',
              'DOT': 'polkadot',
              'MATIC': 'matic-network',
              'LINK': 'chainlink',
              'AVAX': 'avalanche-2',
              'UNI': 'uniswap',
              'ATOM': 'cosmos',
              'LTC': 'litecoin',
              'ETC': 'ethereum-classic',
              'XLM': 'stellar',
              'ALGO': 'algorand',
              'VET': 'vechain',
              'ICP': 'internet-computer',
              'FIL': 'filecoin',
              'TRX': 'tron',
              'EOS': 'eos',
              'AAVE': 'aave',
              'MKR': 'maker',
              'GRT': 'the-graph',
              'SAND': 'the-sandbox',
              'MANA': 'decentraland',
              'AXS': 'axie-infinity',
              'THETA': 'theta-token',
              'ENJ': 'enjincoin',
              'CHZ': 'chiliz',
              'HBAR': 'hedera-hashgraph',
              'NEAR': 'near',
              'FTM': 'fantom',
              'EGLD': 'elrond-erd-2',
              'FLOW': 'flow',
              'XTZ': 'tezos',
              'QNT': 'quant-network',
              'ZEC': 'zcash',
              'DASH': 'dash',
              'BCH': 'bitcoin-cash',
              'BSV': 'bitcoin-sv',
              'ZIL': 'zilliqa',
              'IOTA': 'iota',
              'NEO': 'neo',
              'ONT': 'ontology',
              'WAVES': 'waves',
              'OMG': 'omisego',
              'SNX': 'havven',
              'CRV': 'curve-dao-token',
              'COMP': 'compound-governance-token',
              'YFI': 'yearn-finance',
              'SUSHI': 'sushi',
              '1INCH': '1inch',
              'BAL': 'balancer',
              'REN': 'republic-protocol',
              'KNC': 'kyber-network-crystal',
              'ZRX': '0x',
              'BAT': 'basic-attention-token',
              'STORJ': 'storj',
              'SKL': 'skale',
              'COTI': 'coti',
              'CHR': 'chromia',
              'KAVA': 'kava',
              'BAND': 'band-protocol',
              'RLC': 'iexec-rlc',
              'OCEAN': 'ocean-protocol',
              'BEL': 'bella-protocol',
              'CTK': 'certik',
              'ALPHA': 'alpha-finance',
              'LRC': 'loopring',
              'QTUM': 'qtum',
              'IOST': 'iostoken',
              'CELR': 'celer-network',
              'ONE': 'harmony',
              'HOT': 'holo',
              'MTL': 'metal',
              'OGN': 'origin-protocol',
              'NKN': 'nkn',
              'DENT': 'dent',
              'KEY': 'selfkey',
              'STPT': 'standard-tokenization-protocol',
              'ANKR': 'ankr',
              'REEF': 'reef-finance',
              'DODO': 'dodo',
              'CAKE': 'pancakeswap-token',
              'BAKE': 'bakerytoken',
              'AUTO': 'auto',
              'TKO': 'tokocrypto',
              'ALPACA': 'alpaca-finance',
              'PERP': 'perpetual-protocol',
              'LIT': 'litentry',
              'SFP': 'safepal',
              'DEGO': 'dego-finance',
              'CELO': 'celo',
              'KLAY': 'klay-token',
              'AR': 'arweave',
              'CTSI': 'cartesi',
              'LINA': 'linear',
              'PERL': 'perlin',
              'RIF': 'rsk-infrastructure-framework',
              'CFX': 'conflux-token',
              'EPS': 'ellipsis',
              'AUDIO': 'audius',
              'LAZIO': 'lazio-fan-token',
              'PORTO': 'fc-porto',
              'CITY': 'manchester-city-fan-token',
              'BAR': 'fc-barcelona-fan-token',
              'FORTH': 'ampleforth-governance-token',
              'CTXC': 'cortex',
              'XEC': 'ecash',
              'C98': 'coin98',
              'ENS': 'ethereum-name-service',
              'GALA': 'gala',
              'ILV': 'illuvium',
              'YGG': 'yield-guild-games',
              'SYS': 'syscoin',
              'DF': 'dforce-token',
              'FIDA': 'bonfida',
              'FRONT': 'frontier-token',
              'CVP': 'power-pool',
              'AGLD': 'adventure-gold',
              'RAD': 'radicle',
              'BETA': 'beta-finance',
              'RARE': 'superrare',
              'ADX': 'adex',
              'AUCTION': 'auction',
              'DAR': 'mines-of-dalarnia',
              'BNX': 'binaryx',
              'RGT': 'rari-governance-token',
              'MOVR': 'moonriver',
              'KP3R': 'keep3rv1',
              'QI': 'benqi',
              'POWR': 'power-ledger',
              'VGX': 'ethos',
              'JASMY': 'jasmy',
              'AMP': 'amp-token',
              'PLA': 'playdapp',
              'PYTH': 'pyth-network',
              'PAXG': 'pax-gold',
              'PENDLE': 'pendle',
              'HOOK': 'hooked-protocol',
              'MAGIC': 'magic',
              'HIFI': 'hifi-finance',
              'ID': 'space-id',
              'ARB': 'arbitrum',
              'EDU': 'edu-coin',
              'SUI': 'sui',
              '1000SATS': 'satoshi',
              '1000PEPE': 'pepe',
              '1000FLOKI': 'floki',
              'ACE': 'endurance',
              'NFP': 'nfp',
              'AI': 'sleepless-ai',
              'XAI': 'xai-blockchain',
              'MANTA': 'manta-network',
              'ALT': 'altlayer',
              'JTO': 'jito-governance-token',
              '1000BONK': 'bonk'
            }
            const coinName = coinNameMap[symbol] || symbol.toLowerCase()
            return {
              id: symbol.toLowerCase(),
              name: getCoinName(symbol),
              symbol: symbol,
              price: parseFloat(ticker.lastPrice),
              change24h: parseFloat(ticker.priceChangePercent),
              high24h: parseFloat(ticker.highPrice),
              low24h: parseFloat(ticker.lowPrice),
              volume: parseFloat(ticker.quoteVolume),
              marketCap: parseFloat(ticker.quoteVolume) * parseFloat(ticker.lastPrice),
              image: `https://assets.coingecko.com/coins/images/${imageId}/small/${coinName}.png`
            }
          })
        }
      } catch (error) {
        console.log('Binance failed, using CoinGecko fallback')
      }
    } else if (category === 'gainers') {
      try {
        const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`)
        if (response.ok) {
          const allTickers = await response.json()
          const usdtPairs = allTickers
            .filter(t => t.symbol.endsWith('USDT'))
            .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
            .slice(0, 250)
          
          return usdtPairs.map(ticker => {
            const symbol = ticker.symbol.replace('USDT', '')
            return {
              id: symbol.toLowerCase(),
              name: getCoinName(symbol),
              symbol: symbol,
              price: parseFloat(ticker.lastPrice),
              change24h: parseFloat(ticker.priceChangePercent),
              high24h: parseFloat(ticker.highPrice),
              low24h: parseFloat(ticker.lowPrice),
              volume: parseFloat(ticker.quoteVolume),
              image: `https://assets.coingecko.com/coins/images/${getCoinImageId(symbol)}/small/${symbol.toLowerCase()}.png`
            }
          })
        }
      } catch (error) {
        console.log('Binance failed, using CoinGecko fallback')
      }
    } else if (category === 'losers') {
      try {
        const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`)
        if (response.ok) {
          const allTickers = await response.json()
          const usdtPairs = allTickers
            .filter(t => t.symbol.endsWith('USDT'))
            .sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
            .slice(0, 250)
          
          return usdtPairs.map(ticker => {
            const symbol = ticker.symbol.replace('USDT', '')
            return {
              id: symbol.toLowerCase(),
              name: getCoinName(symbol),
              symbol: symbol,
              price: parseFloat(ticker.lastPrice),
              change24h: parseFloat(ticker.priceChangePercent),
              high24h: parseFloat(ticker.highPrice),
              low24h: parseFloat(ticker.lowPrice),
              volume: parseFloat(ticker.quoteVolume),
              image: `https://assets.coingecko.com/coins/images/${getCoinImageId(symbol)}/small/${symbol.toLowerCase()}.png`
            }
          })
        }
      } catch (error) {
        console.log('Binance failed, using CoinGecko fallback')
      }
    }
    
    // Fallback to CoinGecko
    return await getCoinGeckoPrices(category)
  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    return []
  }
}

export const getFavourites = async (coinIds = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano']) => {
  try {
    // Try Binance first
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT']
    const tickers = await getBinanceTickers(symbols)
    
    if (tickers && tickers.length > 0) {
      return tickers.map(ticker => {
        const symbol = ticker.symbol.replace('USDT', '')
        return {
          id: symbol.toLowerCase(),
          name: getCoinName(symbol),
          symbol: symbol,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChangePercent),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          volume: parseFloat(ticker.quoteVolume),
          image: `https://assets.coingecko.com/coins/images/${getCoinImageId(symbol)}/small/${symbol.toLowerCase()}.png`
        }
      })
    }
    
    // Fallback to CoinGecko
    const ids = coinIds.join(',')
    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return data.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price || 0,
      change24h: coin.price_change_percentage_24h || 0,
      image: coin.image
    }))
  } catch (error) {
    console.error('Error fetching favourites:', error)
    return []
  }
}


export const getCryptoNews = async () => {
  try {
    // Method 1: Try CryptoCompare API
    try {
      const url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN'
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.Data && data.Data.length > 0) {
          return data.Data.slice(0, 5).map(news => ({
            title: news.title,
            source: news.source_info?.name || 'CryptoNews',
            time: getTimeAgo(news.published_on * 1000),
            url: news.url,
            image: news.imageurl
          }))
        }
      }
    } catch (error) {
      console.log('CryptoCompare API failed, using fallback')
    }

    // Method 2: Try CoinGecko news (if available)
    try {
      const url = 'https://api.coingecko.com/api/v3/news'
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.data && data.data.length > 0) {
          return data.data.slice(0, 5).map(news => ({
            title: news.title,
            source: news.source || 'CoinGecko',
            time: getTimeAgo(new Date(news.created_at).getTime()),
            url: news.url,
            image: news.thumb_2x || news.thumb
          }))
        }
      }
    } catch (error) {
      console.log('CoinGecko news failed, using fallback')
    }

    // Method 3: Fallback to mock news (always available)
    return getMockNews()
  } catch (error) {
    console.error('Error fetching crypto news:', error)
    return getMockNews()
  }
}

// Mock news fallback
const getMockNews = () => {
  const mockNews = [
    {
      title: 'Bitcoin Reaches New All-Time High Amid Institutional Adoption',
      source: 'CryptoNews',
      time: '2h ago',
      url: '#',
      image: null
    },
    {
      title: 'Ethereum 2.0 Upgrade Completes Successfully',
      source: 'Blockchain Daily',
      time: '5h ago',
      url: '#',
      image: null
    },
    {
      title: 'Major Banks Announce Crypto Trading Services',
      source: 'Finance Times',
      time: '8h ago',
      url: '#',
      image: null
    },
    {
      title: 'New DeFi Protocol Launches with $100M TVL',
      source: 'DeFi Times',
      time: '12h ago',
      url: '#',
      image: null
    },
    {
      title: 'Regulatory Clarity Improves Crypto Market Sentiment',
      source: 'CryptoWatch',
      time: '1d ago',
      url: '#',
      image: null
    }
  ]
  
  return mockNews
}

const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((new Date() - timestamp) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

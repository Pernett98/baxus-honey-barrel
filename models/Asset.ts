export type Attributes = {
  "Producer Type": string
  "Baxus Class ID": string
  Size: string
  "Baxus Class Name": string
  "Original Cask Yield": string
  "Cask Type": string
  Name: string
  Series: string
  Type: string
  Producer: string
  ABV: string
  "Year Bottled": string
  PackageShot: boolean
  Packaging: string
  Country: string
  Region: string
  Blurhash: string
}

export type Asset = {
  lastHeartbeat: string | null
  blurhash: string
  index: string
  description: string
  listedDate: string
  packageShot: boolean
  spiritType: string
  isListed: boolean
  nftAddress: string
  price: number
  imageUrl: string
  name: string
  attributes: Attributes
  id: string
  ownerAddress: string
  buyerAddress: string | null
  inCartExpiration: string | null
  status: string
  animationUrl: string
  type: string
}

export type AssetDocument = {
  _index: string
  _id: string
  _score: number
  _ignored?: string[]
  _source: Asset
}

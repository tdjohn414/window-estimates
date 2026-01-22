// Test data for glass/window estimates - realistic data based on industry standards

export const testProjects = [
  'Desert Ridge',
  'Scottsdale Heights',
  'Paradise Valley',
  'Chandler Commons',
  'Gilbert Crossing',
  'Mesa Verde',
  'Tempe Terrace',
  'Phoenix Plaza',
  'Glendale Gardens',
  'Peoria Pines',
  'Fountain Hills',
  'Cave Creek',
  'Carefree Estates',
  'Sun City West',
  'Anthem Ranch',
  'Queen Creek',
  'San Tan Valley',
  'Buckeye Farms',
  'Goodyear Heights',
  'Avondale Vista',
]

export const testClients = [
  { name: 'John Martinez', phone: '602-555-1234', email: 'jmartinez@email.com' },
  { name: 'Sarah Johnson', phone: '480-555-2345', email: 'sjohnson@gmail.com' },
  { name: 'Michael Chen', phone: '623-555-3456', email: 'mchen@outlook.com' },
  { name: 'Emily Rodriguez', phone: '520-555-4567', email: 'erodriguez@yahoo.com' },
  { name: 'David Thompson', phone: '928-555-5678', email: 'dthompson@email.com' },
  { name: 'Jennifer Williams', phone: '602-555-6789', email: 'jwilliams@gmail.com' },
  { name: 'Robert Garcia', phone: '480-555-7890', email: 'rgarcia@outlook.com' },
  { name: 'Lisa Anderson', phone: '623-555-8901', email: 'landerson@email.com' },
  { name: 'James Wilson', phone: '520-555-9012', email: 'jwilson@yahoo.com' },
  { name: 'Amanda Taylor', phone: '928-555-0123', email: 'ataylor@gmail.com' },
  { name: 'Christopher Lee', phone: '602-555-1357', email: 'clee@email.com' },
  { name: 'Jessica Brown', phone: '480-555-2468', email: 'jbrown@outlook.com' },
  { name: 'Daniel Harris', phone: '623-555-3579', email: 'dharris@gmail.com' },
  { name: 'Michelle Davis', phone: '520-555-4680', email: 'mdavis@yahoo.com' },
  { name: 'Kevin Miller', phone: '928-555-5791', email: 'kmiller@email.com' },
  { name: 'Stephanie Moore', phone: '602-555-6802', email: 'smoore@gmail.com' },
  { name: 'Brian Jackson', phone: '480-555-7913', email: 'bjackson@outlook.com' },
  { name: 'Nicole White', phone: '623-555-8024', email: 'nwhite@email.com' },
  { name: 'Jason Martin', phone: '520-555-9135', email: 'jmartin@yahoo.com' },
  { name: 'Rachel Clark', phone: '928-555-0246', email: 'rclark@gmail.com' },
]

export const testRooms = [
  'Living Room',
  'Master Bedroom',
  'Kitchen',
  'Dining Room',
  'Family Room',
  'Guest Bedroom',
  'Office',
  'Bathroom',
  'Hallway',
  'Garage',
  'Patio',
  'Sunroom',
  'Basement',
  'Foyer',
  'Laundry Room',
  'Kids Room',
  'Den',
  'Breakfast Nook',
  'Mud Room',
  'Bonus Room',
]

// Realistic glass/window line items with typical pricing
export const testLineItems = [
  // Single Pane Windows
  { description: '24" x 36" Single Pane Window', unitPrice: 185 },
  { description: '30" x 48" Single Pane Window', unitPrice: 225 },
  { description: '36" x 60" Single Pane Window', unitPrice: 295 },

  // Double Pane / Insulated Windows
  { description: '24" x 36" Double Pane Insulated Window', unitPrice: 285 },
  { description: '30" x 48" Double Pane Insulated Window', unitPrice: 345 },
  { description: '36" x 60" Double Pane Insulated Window', unitPrice: 425 },
  { description: '48" x 48" Double Pane Insulated Window', unitPrice: 485 },
  { description: '60" x 48" Double Pane Insulated Window', unitPrice: 565 },

  // Low-E Windows
  { description: '24" x 36" Low-E Energy Efficient Window', unitPrice: 325 },
  { description: '30" x 48" Low-E Energy Efficient Window', unitPrice: 395 },
  { description: '36" x 60" Low-E Energy Efficient Window', unitPrice: 485 },
  { description: '48" x 60" Low-E Energy Efficient Window', unitPrice: 595 },

  // Sliding Glass Doors
  { description: '6\' Sliding Glass Door - Standard', unitPrice: 850 },
  { description: '8\' Sliding Glass Door - Standard', unitPrice: 1150 },
  { description: '6\' Sliding Glass Door - Low-E', unitPrice: 1250 },
  { description: '8\' Sliding Glass Door - Low-E', unitPrice: 1650 },
  { description: '10\' Sliding Glass Door - Low-E', unitPrice: 2150 },

  // French Doors
  { description: '6\' French Door - Clear Glass', unitPrice: 1450 },
  { description: '6\' French Door - Frosted Glass', unitPrice: 1650 },
  { description: '8\' French Door - Clear Glass', unitPrice: 1850 },

  // Shower Doors & Enclosures
  { description: 'Frameless Shower Door 36" x 72"', unitPrice: 895 },
  { description: 'Frameless Shower Door 48" x 72"', unitPrice: 1095 },
  { description: 'Frameless Shower Enclosure - Corner', unitPrice: 1495 },
  { description: 'Semi-Frameless Shower Door 36"', unitPrice: 595 },
  { description: 'Sliding Shower Door 60"', unitPrice: 745 },

  // Glass Replacement
  { description: 'Tempered Glass Panel 24" x 36"', unitPrice: 145 },
  { description: 'Tempered Glass Panel 36" x 48"', unitPrice: 225 },
  { description: 'Tempered Glass Panel 48" x 60"', unitPrice: 345 },
  { description: 'Laminated Safety Glass 24" x 36"', unitPrice: 195 },
  { description: 'Laminated Safety Glass 36" x 48"', unitPrice: 285 },

  // Mirrors
  { description: 'Custom Mirror 24" x 36"', unitPrice: 165 },
  { description: 'Custom Mirror 36" x 48"', unitPrice: 245 },
  { description: 'Custom Mirror 48" x 60"', unitPrice: 365 },
  { description: 'Beveled Edge Mirror 30" x 40"', unitPrice: 295 },
  { description: 'Full Length Mirror 24" x 72"', unitPrice: 285 },

  // Specialty Glass
  { description: 'Frosted Privacy Glass 24" x 36"', unitPrice: 215 },
  { description: 'Frosted Privacy Glass 36" x 48"', unitPrice: 295 },
  { description: 'Tinted Glass Panel - Bronze', unitPrice: 185 },
  { description: 'Tinted Glass Panel - Gray', unitPrice: 185 },
  { description: 'Decorative Textured Glass', unitPrice: 265 },

  // Storefront / Commercial
  { description: 'Storefront Glass Panel 4\' x 8\'', unitPrice: 425 },
  { description: 'Commercial Entry Door Glass', unitPrice: 545 },
  { description: 'Display Case Glass Shelf', unitPrice: 85 },

  // Tabletops
  { description: 'Glass Tabletop 36" Round - 1/4"', unitPrice: 145 },
  { description: 'Glass Tabletop 48" Round - 3/8"', unitPrice: 225 },
  { description: 'Glass Tabletop 36" x 60" Rectangle', unitPrice: 195 },
  { description: 'Glass Desk Top 30" x 60"', unitPrice: 245 },

  // Repairs & Services
  { description: 'Window Seal Replacement', unitPrice: 125 },
  { description: 'Foggy Window Repair - Double Pane', unitPrice: 195 },
  { description: 'Screen Replacement - Standard', unitPrice: 45 },
  { description: 'Screen Replacement - Solar', unitPrice: 85 },
  { description: 'Window Hardware Replacement', unitPrice: 65 },
  { description: 'Weatherstripping Replacement', unitPrice: 55 },
]

export const testLaborRates = [
  450,
  650,
  850,
  1200,
  1500,
  1800,
  2200,
  2500,
  2800,
  3200,
  3500,
  3800,
  4200,
  4500,
  5000,
  5500,
  6000,
  6500,
  7000,
  7500,
]

// Helper function to get random item from array
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to get random number between min and max
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Test images to attach to line items
const testImages = [
  'https://res.cloudinary.com/dqvolqe3u/image/upload/v1769114835/sunny-state-quotes/fepd3bqxgamye5afqogd.png',
  'https://res.cloudinary.com/dqvolqe3u/image/upload/v1769115841/sunny-state-quotes/uiw1ussvmoihcssykk6s.png',
  'https://res.cloudinary.com/dqvolqe3u/image/upload/v1769115844/sunny-state-quotes/ulxbwcygeednuwvmctgp.png',
]

// Generate random test data
export function generateTestData(lineItemCount: number = 3) {
  const client = getRandomItem(testClients)
  const usedRooms = new Set<string>()
  const usedDescriptions = new Set<string>()

  const lineItems: {
    id: string
    room: string
    description: string
    quantity: number
    unitPrice: number
    total: number
    imageUrls: string[]
  }[] = []
  for (let i = 0; i < lineItemCount; i++) {
    // Get unique room (or empty if we've used them all)
    let room = ''
    if (usedRooms.size < testRooms.length && Math.random() > 0.3) {
      do {
        room = getRandomItem(testRooms)
      } while (usedRooms.has(room))
      usedRooms.add(room)
    }

    // Get unique line item
    let item
    do {
      item = getRandomItem(testLineItems)
    } while (usedDescriptions.has(item.description) && usedDescriptions.size < testLineItems.length)
    usedDescriptions.add(item.description)

    const quantity = getRandomInt(1, 4)

    lineItems.push({
      id: crypto.randomUUID(),
      room,
      description: item.description,
      quantity,
      unitPrice: item.unitPrice,
      total: quantity * item.unitPrice,
      imageUrls: [] as string[],
    })
  }

  // Add test images to 3 unique rows if we have 3+ line items
  if (lineItemCount >= 3) {
    // Pick 3 random unique indices
    const indices = new Set<number>()
    while (indices.size < 3) {
      indices.add(getRandomInt(0, lineItemCount - 1))
    }
    const indexArray = Array.from(indices)

    // Assign one image to each selected row
    indexArray.forEach((idx, i) => {
      lineItems[idx].imageUrls = [testImages[i]]
    })
  }

  return {
    projectName: getRandomItem(testProjects),
    quoteNumber: String(getRandomInt(100, 999)),
    clientName: client.name,
    clientPhone: client.phone,
    clientEmail: client.email,
    laborInstallation: getRandomItem(testLaborRates),
    lineItems,
  }
}

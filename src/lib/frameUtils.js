const SAMPLE_SIZE = 10
const MAX_DIFF = 255 * 3 * SAMPLE_SIZE * SAMPLE_SIZE

const toDataUrl = (frame) => {
  if (!frame) return ''
  if (frame.startsWith('data:image/')) return frame
  return `data:image/jpeg;base64,${frame}`
}

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to decode frame image.'))
    image.src = src
  })
}

/**
 * Compares two base64 JPEG frames and returns a difference score 0-100.
 * 0 = identical, 100 = completely different.
 *
 * @param {string} frame1
 * @param {string} frame2
 * @returns {Promise<number>}
 */
export const getFrameDifference = async (frame1, frame2) => {
  if (!frame1 || !frame2) return 100

  try {
    const [img1, img2] = await Promise.all([loadImage(toDataUrl(frame1)), loadImage(toDataUrl(frame2))])

    const canvas1 = document.createElement('canvas')
    const canvas2 = document.createElement('canvas')

    canvas1.width = canvas2.width = SAMPLE_SIZE
    canvas1.height = canvas2.height = SAMPLE_SIZE

    const ctx1 = canvas1.getContext('2d')
    const ctx2 = canvas2.getContext('2d')
    if (!ctx1 || !ctx2) return 100

    ctx1.drawImage(img1, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    ctx2.drawImage(img2, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

    const data1 = ctx1.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data
    const data2 = ctx2.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data

    let totalDiff = 0
    for (let index = 0; index < data1.length; index += 4) {
      totalDiff += Math.abs(data1[index] - data2[index])
      totalDiff += Math.abs(data1[index + 1] - data2[index + 1])
      totalDiff += Math.abs(data1[index + 2] - data2[index + 2])
    }

    return (totalDiff / MAX_DIFF) * 100
  } catch {
    // If decode fails, treat as changed so we don't suppress potentially important frames.
    return 100
  }
}

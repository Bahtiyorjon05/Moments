// Share a post link (native share sheet, or copy to clipboard).
export async function sharePost(post, toast) {
  const url = `${location.origin}/p/${post.id}`
  const title = `${post.author?.username || 'Moments'} on Moments`
  if (navigator.share) {
    try { await navigator.share({ title, text: post.caption || title, url }); return }
    catch { /* user cancelled */ return }
  }
  try {
    await navigator.clipboard.writeText(url)
    toast?.('Link copied to clipboard', 'success')
  } catch {
    toast?.('Could not copy link', 'error')
  }
}

export async function copyLink(post, toast) {
  const url = `${location.origin}/p/${post.id}`
  try { await navigator.clipboard.writeText(url); toast?.('Link copied', 'success') }
  catch { toast?.('Could not copy', 'error') }
}

// Download a media file (image/video) from its URL.
export async function downloadMedia(url, toast, name) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const ext = blob.type.includes('video') ? 'mp4' : blob.type.includes('png') ? 'png' : 'jpg'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name || `moments-${Date.now()}.${ext}`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast?.('Download started', 'success')
  } catch {
    window.open(url, '_blank') // fallback
  }
}

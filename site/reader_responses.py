"""Singhasan's private correspondence and moderated reader responses."""
def responses(c,icon):
    if not c['number']:return ''
    return f'''<section id="reader-responses" class="poem-engagement" data-poem-engagement="{c['number']}" aria-label="Reader responses">
 <div class="like-row"><button type="button" data-like disabled aria-pressed="false" aria-label="Like this poem"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.5 3.8 12.4C-1.6 6.8 6.4 0 12 6.8 17.6 0 25.6 6.8 20.2 12.4Z"/></svg><span data-like-label>Like</span><span data-like-count aria-hidden="true" hidden></span></button><span data-like-status role="status"></span></div>
 <details><summary><svg class="comment-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 4.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 3v-3a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h6"/></svg><span>Comments</span><svg class="comments-chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4"/></svg></summary>
  <p class="service-note" data-service-note>Comments are unavailable here.</p>
  <div data-comments-list role="region" aria-label="Published comments" aria-live="polite"></div>
  <button type="button" class="text-link" data-comments-more hidden>Load more comments</button>
  <form data-public-comment><fieldset class="form-stack" disabled><legend class="sr-only">Leave a comment</legend>
   <label><span class="sr-only">Your comment</span><textarea name="message" rows="3" required maxlength="2000" placeholder="Write a comment…" aria-describedby="comment-review-note"></textarea></label>
   <div class="comment-submit-row"><button class="btn" type="submit">Post comment</button><p class="small muted" id="comment-review-note">Comments are public after review.</p></div></fieldset><p class="status" role="status"></p>
  </form>
 </details>
</section>'''


def contact_page(icon):
    return f'''<article class="contact-poet" lang="en">
 <header><h1>Contact the poet</h1><p class="contact-intro">Share a thought or ask about a poem. Write to Pravakar Satapathy through his family.</p></header>
 <div class="contact-layout">
  <form class="reader-message" data-feedback="private" aria-label="Private message to the poet’s family">
   <fieldset data-contact-fields disabled><legend class="sr-only">Your private message</legend>
    <div class="contact-details"><label>Name<input name="name" autocomplete="name" maxlength="120" required></label><label>Email<input type="email" name="email" autocomplete="email" maxlength="254" required></label></div>
    <label>About<select name="reason"><option value="note">A note to the poet</option><option value="correction">A correction in the book</option></select></label>
    <input type="hidden" name="poem">
    <label>Message<textarea name="message" rows="5" maxlength="5000" required aria-describedby="contact-privacy"></textarea></label>
    <p class="small muted contact-privacy" id="contact-privacy">Your message and contact details are kept private for the poet’s family.</p>
    <button type="submit" disabled>Send message</button>
    <p class="contact-status" role="status" aria-live="polite"></p>
   </fieldset>
   <noscript>Please enable JavaScript to send a private message through this form.</noscript>
  </form>
  <aside aria-label="Meet the poet"><img src="assets/writers/41-earth-voice-v1.png" width="1086" height="1448" alt="Portrait of Pravakar Satapathy" loading="lazy"><h2 lang="or">ପ୍ରଭାକର ଶତପଥୀ</h2><p>He loves meeting readers and talking about poetry. If you’re in Bhubaneswar, write to his family to arrange a visit.</p><a href="author.html">About the poet {icon('next-poetic')}</a></aside>
 </div>
</article>'''

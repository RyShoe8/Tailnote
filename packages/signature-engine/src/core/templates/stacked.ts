/** Stacked layout: logo on top, full-width contact below (table-only, inline styles). */
export const STACKED_SIGNATURE_TEMPLATE = `<table class="sig-stacked-root" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; line-height:1.4;width:100%;max-width:665px;">
  <tr>
    <td valign="top" width="1%" style="vertical-align:top;line-height:0;font-size:0;padding-bottom:12px;padding-right:12px;white-space:nowrap;width:1%;">
      {{#if hasLogo}}
      <span data-sig-field="logo">
      <a href="{{logoLink}}" style="text-decoration:none; border:0; outline:none; display:block;">
{{#if hasLogoSizedHeight}}
        <img src="{{logoUrl}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
{{#if hasLogoAutoHeight}}
        <img src="{{logoUrl}}" width="{{logoWidth}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
      </a>
      </span>
      {{/if}}
    </td>
    {{#if showAddressBlock}}
    <td valign="top" style="vertical-align:top;font-size:12px;color:#555;line-height:1.35;padding-bottom:12px;white-space:nowrap;">
      {{addressBlockHtml}}
    </td>
    {{/if}}
  </tr>
  <tr>
    <td colspan="2" style="vertical-align:top; border-top:2px solid {{primaryColor}}; padding-top:12px;">
      {{#if hasOrderedMainStack}}
      {{orderedMainStackHtml}}
      {{/if}}

      {{#if showSocialBlock}}
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:10px;"><tr>
        {{#if hasLinkedin}}
        <td style="{{socialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconLinkedin}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasFacebook}}
        <td style="{{socialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconFacebook}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasInstagram}}
        <td style="{{socialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconInstagram}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasReddit}}
        <td style="{{socialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconReddit}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasDiscord}}
        <td style="{{socialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconDiscord}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasBluesky}}
        <td style="{{socialTdBlueskyStyle}}"><a href="{{bluesky}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconBluesky}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasYoutube}}
        <td style="{{socialTdYoutubeStyle}}"><a href="{{youtube}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconYoutube}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
      </tr></table>
      {{/if}}
    </td>
  </tr>

  {{#if hasDivider}}
  <tr>
    <td colspan="2" style="padding-top:14px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="#e5e5e5" height="1" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:1px;background-color:#e5e5e5;border:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  {{/if}}

  {{#if hasContentBlocks}}
  <tr>
    <td colspan="2" style="padding-top:12px;">
      {{contentBlocksHtmlStacked}}
    </td>
  </tr>
  {{/if}}
</table>`;

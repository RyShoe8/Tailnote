/**
 * Default layout — logo column with brand accent border, name/title band,
 * P|E|W contact row, social icons, two-column list footer for promo blocks.
 */
export const DEFAULT_SIGNATURE_TEMPLATE = `<table class="sig-default-layout-table" cellpadding="0" cellspacing="0" border="0" style="font-family: {{fontFamily}}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.5; background-color: #ffffff; max-width: 660px; width: 100%;">
  <tr>
    <td valign="top" style="padding-right: 20px; border-right: 2px solid {{secondaryColor}};">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
        {{#if hasLogo}}
        <tr>
          <td valign="top" style="line-height: 0; font-size: 0;">
            <a href="{{logoLink}}" style="text-decoration: none; border: 0; outline: none; display: block;">
              {{#if hasLogoSizedHeight}}
              <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;border-radius:{{logoImgBorderRadius}};" />
              {{/if}}
              {{#if hasLogoAutoHeight}}
              <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;border-radius:{{logoImgBorderRadius}};" />
              {{/if}}
            </a>
          </td>
        </tr>
        {{/if}}
        {{#if showAddressBlock}}
        <tr>
          <td valign="top" style="padding-top: 8px; font-size: 11px; color: #888888; line-height: 1.35; letter-spacing: 0.2px;">
            {{addressBlockHtml}}
          </td>
        </tr>
        {{/if}}
      </table>
    </td>
    <td valign="top" style="padding-left: 20px;">
      {{#if hasOrderedMainStack}}
      {{orderedMainStackHtml}}
      {{/if}}
      {{#if showSocialBlock}}
      <div style="margin-bottom: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr>
        {{#if hasLinkedin}}
        <td style="{{defaultSocialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconLinkedin}}" alt="LinkedIn" width="20" height="20" style="width: 20px; height: 20px; display: block; border: 0;" /></a></td>
        {{/if}}
        {{#if hasFacebook}}
        <td style="{{defaultSocialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconFacebook}}" alt="Facebook" width="20" height="20" style="width: 20px; height: 20px; display: block; border: 0;" /></a></td>
        {{/if}}
        {{#if hasInstagram}}
        <td style="{{defaultSocialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconInstagram}}" alt="Instagram" width="20" height="20" style="width: 20px; height: 20px; display: block; border: 0;" /></a></td>
        {{/if}}
        {{#if hasReddit}}
        <td style="{{defaultSocialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconReddit}}" alt="Reddit" width="20" height="20" style="width: 20px; height: 20px; display: block; border: 0;" /></a></td>
        {{/if}}
        {{#if hasDiscord}}
        <td style="{{defaultSocialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconDiscord}}" alt="Discord" width="20" height="20" style="width: 20px; height: 20px; display: block; border: 0;" /></a></td>
        {{/if}}
        {{#if hasBluesky}}
        <td style="{{defaultSocialTdBlueskyStyle}}"><a href="{{bluesky}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconBluesky}}" alt="Bluesky" width="20" height="20" style="width: 20px; height: 20px; display: block; border: 0;" /></a></td>
        {{/if}}
        {{#if hasYoutube}}
        <td style="{{defaultSocialTdYoutubeStyle}}"><a href="{{youtube}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconYoutube}}" alt="YouTube" width="20" height="20" style="width: 20px; height: 20px; display: block; border: 0;" /></a></td>
        {{/if}}
        </tr></table>
      </div>
      {{/if}}
      {{#if hasDefaultListFooter}}
      {{defaultListFooterHtml}}
      {{/if}}
    </td>
  </tr>
</table>`;

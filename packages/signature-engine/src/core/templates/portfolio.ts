/**
 * Portfolio layout — dark centered card, logo (rectangle preserves aspect ratio; circle is square),
 * contact pill buttons, network portfolio tags from list blocks, social icons in footer.
 * Card background uses {{primaryColor}}; panel/border colors are derived in the renderer.
 * Accent color uses {{secondaryColor}} (falls back to primaryColor in renderer).
 */
export const PORTFOLIO_SIGNATURE_TEMPLATE = `<table class="sig-portfolio-root" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:460px;width:100%;font-family:{{fontFamily}},-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:{{primaryColor}};border-radius:24px;color:#F4F7F6;border:1px solid {{portfolioBorderColor}};">
  <tr>
    <td style="padding:24px;text-align:center;">
      {{#if hasLogo}}
      <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px auto;border-collapse:collapse;">
        <tr>
          <td align="center" style="line-height:0;font-size:0;">
            <a href="{{logoLink}}" style="text-decoration:none;border:0;outline:none;display:block;">
              {{#if hasLogoSizedHeight}}
              <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" style="display:block;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;max-width:{{logoWidth}}px;border-radius:{{logoImgBorderRadius}};border:3px solid {{secondaryColor}};background-color:#ffffff;" />
              {{/if}}
              {{#if hasLogoAutoHeight}}
              <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border-radius:{{logoImgBorderRadius}};border:3px solid {{secondaryColor}};background-color:#ffffff;" />
              {{/if}}
            </a>
          </td>
        </tr>
      </table>
      {{/if}}
      {{#if hasName}}
      <div style="font-size:20px;font-weight:700;color:#FFFFFF;margin-bottom:2px;letter-spacing:-0.3px;">{{fullName}}</div>
      {{/if}}
      {{#if hasPortfolioRoleLine}}
      <div style="font-size:12px;color:{{secondaryColor}};font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:20px;">{{portfolioRoleLine}}</div>
      {{/if}}
      {{#if hasPortfolioContactPills}}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:4px;">
        {{portfolioContactPillsHtml}}
      </table>
      {{/if}}
      {{#if hasPortfolioNetworkSection}}
      {{portfolioNetworkSectionHtml}}
      {{/if}}
      {{#if showSocialBlock}}
      <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 0 auto;border-collapse:collapse;border-top:1px solid {{portfolioPanelColor}};width:100%;">
        <tr>
          <td style="padding-top:14px;text-align:center;line-height:0;font-size:0;">
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;">
              <tr>
                {{#if hasLinkedin}}
                <td style="{{portfolioSocialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconLinkedin}}" alt="LinkedIn" width="18" style="width:18px;height:auto;display:block;border:0;" /></a></td>
                {{/if}}
                {{#if hasFacebook}}
                <td style="{{portfolioSocialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconFacebook}}" alt="Facebook" width="18" style="width:18px;height:auto;display:block;border:0;" /></a></td>
                {{/if}}
                {{#if hasInstagram}}
                <td style="{{portfolioSocialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconInstagram}}" alt="Instagram" width="18" style="width:18px;height:auto;display:block;border:0;" /></a></td>
                {{/if}}
                {{#if hasReddit}}
                <td style="{{portfolioSocialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconReddit}}" alt="Reddit" width="18" style="width:18px;height:auto;display:block;border:0;" /></a></td>
                {{/if}}
                {{#if hasDiscord}}
                <td style="{{portfolioSocialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconDiscord}}" alt="Discord" width="18" style="width:18px;height:auto;display:block;border:0;" /></a></td>
                {{/if}}
                {{#if hasBluesky}}
                <td style="{{portfolioSocialTdBlueskyStyle}}"><a href="{{bluesky}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconBluesky}}" alt="Bluesky" width="18" style="width:18px;height:auto;display:block;border:0;" /></a></td>
                {{/if}}
                {{#if hasYoutube}}
                <td style="{{portfolioSocialTdYoutubeStyle}}"><a href="{{youtube}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconYoutube}}" alt="YouTube" width="18" style="width:18px;height:auto;display:block;border:0;" /></a></td>
                {{/if}}
              </tr>
            </table>
          </td>
        </tr>
      </table>
      {{/if}}
    </td>
  </tr>
</table>`;

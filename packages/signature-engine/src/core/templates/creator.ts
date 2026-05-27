/**
 * Creator layout — dark card, logo + social in left column, monospace tagline, pill promos.
 */
export const CREATOR_SIGNATURE_TEMPLATE = `<table class="sig-creator-root" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 550px; font-family: {{fontFamily}}, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: {{creatorCardBackground}}; border-radius: 8px; border-left: 4px solid {{creatorAccentColor}};">
  <tr>
    <td style="padding: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
        <tr>
          <td width="120" valign="top" style="text-align: center; padding-right: 20px; border-right: 1px solid #3f4147;">
            {{#if hasLogo}}
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse: collapse; margin: 0 auto;">
              <tr>
                <td align="center" style="line-height: 0; font-size: 0; mso-line-height-rule: exactly; padding-bottom: 15px;">
                  <a href="{{logoLink}}" style="text-decoration: none; border: 0; outline: none; display: block;">
                    {{#if hasLogoSizedHeight}}
                    <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" border="0" style="display: block; max-width: {{logoWidth}}px; width: {{logoWidth}}px; height: {{logoDisplayHeight}}px; border: 0; border-radius: {{logoImgBorderRadius}};" />
                    {{/if}}
                    {{#if hasLogoAutoHeight}}
                    <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" border="0" style="display: block; max-width: {{logoWidth}}px; width: {{logoWidth}}px; height: auto; border: 0; border-radius: {{logoImgBorderRadius}};" />
                    {{/if}}
                  </a>
                </td>
              </tr>
            </table>
            {{/if}}
            {{#if showSocialBlock}}
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse: collapse; margin: 0 auto;">
              <tr>
                {{#if hasLinkedin}}
                <td style="{{creatorSocialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration: none; display: block; border: 0; outline: none;"><img src="{{iconLinkedin}}" alt="LinkedIn" width="18" height="18" border="0" style="width: 18px; height: 18px; display: block; border: 0;" /></a></td>
                {{/if}}
                {{#if hasFacebook}}
                <td style="{{creatorSocialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration: none; display: block; border: 0; outline: none;"><img src="{{iconFacebook}}" alt="Facebook" width="18" height="18" border="0" style="width: 18px; height: 18px; display: block; border: 0;" /></a></td>
                {{/if}}
                {{#if hasInstagram}}
                <td style="{{creatorSocialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration: none; display: block; border: 0; outline: none;"><img src="{{iconInstagram}}" alt="Instagram" width="18" height="18" border="0" style="width: 18px; height: 18px; display: block; border: 0;" /></a></td>
                {{/if}}
                {{#if hasReddit}}
                <td style="{{creatorSocialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration: none; display: block; border: 0; outline: none;"><img src="{{iconReddit}}" alt="Reddit" width="18" height="18" border="0" style="width: 18px; height: 18px; display: block; border: 0;" /></a></td>
                {{/if}}
                {{#if hasDiscord}}
                <td style="{{creatorSocialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration: none; display: block; border: 0; outline: none;"><img src="{{iconDiscord}}" alt="Discord" width="18" height="18" border="0" style="width: 18px; height: 18px; display: block; border: 0;" /></a></td>
                {{/if}}
              </tr>
            </table>
            {{/if}}
            {{#if showAddressBlock}}
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse: collapse; margin: 10px auto 0 auto;">
              <tr>
                <td style="font-size: 11px; color: #72767d; line-height: 1.35; text-align: center;">
                  {{addressBlockHtml}}
                </td>
              </tr>
            </table>
            {{/if}}
          </td>
          <td valign="top" style="padding-left: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
              {{#if hasName}}
              <tr>
                <td style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; padding-bottom: 2px; line-height: 1.2;">
                  {{fullName}}
                </td>
              </tr>
              {{/if}}
              {{#if hasCreatorTagline}}
              <tr>
                <td style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #b5bac1; font-weight: bold; padding-bottom: 12px; text-transform: lowercase; line-height: 1.35;">
                  {{creatorTagline}}
                </td>
              </tr>
              {{/if}}
              {{#if hasCreatorContactTable}}
              <tr>
                <td style="padding-bottom: 15px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #b5bac1; border-collapse: collapse;">
                    {{creatorContactTableHtml}}
                  </table>
                </td>
              </tr>
              {{/if}}
              {{#if hasCreatorPromoPills}}
              <tr>
                <td style="font-size: 11px; color: #b5bac1; line-height: 1.4;">
                  {{creatorPromoPillsHtml}}
                </td>
              </tr>
              {{/if}}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

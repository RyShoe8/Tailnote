/**
 * Creator layout — dark card, logo + social in left column, monospace tagline, pill promos.
 */
export const CREATOR_SIGNATURE_TEMPLATE = `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 550px; font-family: {{fontFamily}}, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1e1f22; border-radius: 8px; border-left: 4px solid {{primaryColor}};">
  <tr>
    <td style="padding: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
        <tr>
          <td width="120" valign="top" style="text-align: center; padding-right: 20px; border-right: 1px solid #3f4147;">
            {{#if hasLogo}}
            <a href="{{logoLink}}" style="text-decoration: none; border: 0; outline: none; display: inline-block;">
              <img src="{{logoUrl}}" alt="{{companyName}}" width="100" style="display: inline-block; max-width: 100px; height: auto; margin-bottom: 15px; border-radius: 4px; border: 0;" />
            </a>
            <br>
            {{/if}}
            {{#if showSocialBlock}}
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse: collapse; margin: 0 auto;">
              <tr>
                {{#if hasLinkedin}}
                <td style="{{creatorSocialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconLinkedin}}" alt="LinkedIn" width="18" style="width: 18px; height: auto; display: block; border: 0;" /></a></td>
                {{/if}}
                {{#if hasFacebook}}
                <td style="{{creatorSocialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconFacebook}}" alt="Facebook" width="18" style="width: 18px; height: auto; display: block; border: 0;" /></a></td>
                {{/if}}
                {{#if hasInstagram}}
                <td style="{{creatorSocialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconInstagram}}" alt="Instagram" width="18" style="width: 18px; height: auto; display: block; border: 0;" /></a></td>
                {{/if}}
                {{#if hasReddit}}
                <td style="{{creatorSocialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconReddit}}" alt="Reddit" width="18" style="width: 18px; height: auto; display: block; border: 0;" /></a></td>
                {{/if}}
                {{#if hasDiscord}}
                <td style="{{creatorSocialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration: none; display: inline-block; border: 0; outline: none;"><img src="{{iconDiscord}}" alt="Discord" width="18" style="width: 18px; height: auto; display: block; border: 0;" /></a></td>
                {{/if}}
              </tr>
            </table>
            {{/if}}
            {{#if showAddressBlock}}
            <div style="margin-top: 10px; font-size: 11px; color: #72767d; line-height: 1.35; text-align: center;">
              {{addressBlockHtml}}
            </div>
            {{/if}}
          </td>
          <td valign="top" style="padding-left: 20px;">
            {{#if hasName}}
            <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 2px;">{{fullName}}</div>
            {{/if}}
            {{#if hasCreatorTagline}}
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #b5bac1; font-weight: bold; margin-bottom: 12px; text-transform: lowercase;">{{creatorTagline}}</div>
            {{/if}}
            {{#if hasCreatorContactTable}}
            <table cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #b5bac1; margin-bottom: 15px; border-collapse: collapse;">
              {{creatorContactTableHtml}}
            </table>
            {{/if}}
            {{#if hasCreatorPromoPills}}
            <div style="font-size: 11px; color: #b5bac1;">
              {{creatorPromoPillsHtml}}
            </div>
            {{/if}}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

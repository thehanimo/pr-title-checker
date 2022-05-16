import * as core from '@actions/core'
import * as github from '@actions/github'

const separator = '--------------------------'
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
const issue_number = github.context.issue.number
const { Octokit } = require('@octokit/action')
const octokit =new Octokit()
let JIRA_TICKETS = []
const firstbody=github.context.payload.pull_request.body
async function run() {
  try {
    const title = github.context.payload.pull_request.title
    const labels = github.context.payload.pull_request.labels
   
    core.info(`firstbody ${firstbody}`)
    const getJiraTicketsFromPrTitle = () => {
      JIRA_TICKETS = title.split('-')[0].split('|')
    }
    const buildCommentBody = (firstbody) => {
      const urlTicket = 'https://support.apps.darva.com/browse/SINAPPSHAB-'
      const ticket= 'Tickets:'
      let tab=[]
      let urlWithSeparator=''
      JIRA_TICKETS.map((e)=> {
        tab.push('\r\n',urlTicket.concat(e))
      })
     if(firstbody && firstbody.toString().includes('https://support.apps.darva.com/browse/SINAPPSHAB')){
      firstbody = firstbody.split(separator)[1]
       core.info(`new Body Data ${firstbody}`)
     }
      urlWithSeparator=ticket.concat('\r\n',...tab).concat('\r\n', separator)
     return urlWithSeparator.concat('\r\n', firstbody)
    }
    core.info(` PR Title ${title}`)
    const pattern = /\d{4,5}/
    const titleContainsJiraNumbers = pattern.test(title, 'i')
    if (titleContainsJiraNumbers) {
      getJiraTicketsFromPrTitle()
      core.setOutput('JIRA_TICKETS', JIRA_TICKETS)
      const bd = buildCommentBody(firstbody)
      await createOrUpdateComment(bd)
    } else {
      await addLabel('NotLinkedToJira')
      core.setOutput('JIRA_TICKETS', [])
    }
  } catch (error) {
    core.info(error)
  }
}

async function createOrUpdateComment(bd) {
  core.info(`in bd (${bd}) `)
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: issue_number,
    body:bd,
  })
}
async function addLabel(name) {
  core.info(`Adding label (${name}) to PR...`)
  let addLabelResponse = await octokit.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [name],
  })
  core.info(`Added label (${name}) to PR - ${addLabelResponse.status}`)
}
if (octokit) {
  run()
}